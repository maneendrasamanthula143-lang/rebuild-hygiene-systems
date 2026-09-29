import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, CheckCircle2, User, Clock, AlertCircle, X, RefreshCw } from 'lucide-react';

export default function QuestionsModal({ recordType, recordId, title, onClose }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getQuestions(recordType, recordId);
      setQuestions(res.questions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [recordType, recordId]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    try {
      await api.askQuestion({
        record_type: recordType,
        record_id: recordId,
        question_text: newQuestion.trim()
      });
      setNewQuestion('');
      fetchQuestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (questionId) => {
    const text = replyTextMap[questionId];
    if (!text || !text.trim()) return;

    setSubmitting(true);
    try {
      await api.replyQuestion(questionId, text.trim());
      setReplyTextMap({ ...replyTextMap, [questionId]: '' });
      fetchQuestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Questions & Audit Remarks Thread</h3>
              <p className="text-xs text-slate-300 font-medium truncate max-w-md">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question History Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" />
              Loading communication audit log...
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 p-6">
              No questions or official remarks recorded for this item yet.
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                {/* Asked By Info */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                      {q.asked_by_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {q.asked_by_name}
                        <span className="bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                          {q.asked_by_role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(q.asked_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-xs text-slate-800 font-medium pl-2 border-l-2 border-[#0B2545]">
                  {q.question_text}
                </div>

                {/* Reply Section */}
                {q.reply_text ? (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Reply from {q.replied_by_name || 'Authorized Supervisor'}
                      </span>
                      <span className="text-[10px] text-amber-700 font-normal">
                        {q.replied_at ? new Date(q.replied_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-amber-950 font-medium">{q.reply_text}</p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type reply to this official inquiry..."
                        value={replyTextMap[q.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap({ ...replyTextMap, [q.id]: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B2545]"
                      />
                      <button
                        onClick={() => handleReply(q.id)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Ask Question Input Form */}
        <form onSubmit={handleAskQuestion} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question or add an official inquiry..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B2545]"
          />
          <button
            type="submit"
            disabled={submitting || !newQuestion.trim()}
            className="px-4 py-2 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Post Question
          </button>
        </form>
      </div>
    </div>
  );
}
