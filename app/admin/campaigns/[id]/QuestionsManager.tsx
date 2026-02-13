'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'checkboxes';
  is_required: boolean;
  display_order: number;
  options: string[] | null;
}

interface Props {
  campaignId: string;
  initialQuestions: Question[];
}

export default function QuestionsManager({ campaignId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text' as 'text' | 'multiple_choice' | 'checkboxes',
    is_required: false,
    options: ['', ''],
  });
  const [editData, setEditData] = useState({
    question_text: '',
    question_type: 'text' as 'text' | 'multiple_choice' | 'checkboxes',
    is_required: false,
    options: ['', ''],
  });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; questionId: string }>({ isOpen: false, questionId: '' });

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setEditData({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      options: question.options || ['', ''],
    });
    setIsAdding(false); // Close add form if open
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      question_text: '',
      question_type: 'text',
      is_required: false,
      options: ['', ''],
    });
  };

  const saveEdit = async (questionId: string) => {
    if (!editData.question_text.trim()) return;

    setLoading(true);
    try {
      const needsOptions = editData.question_type === 'multiple_choice' || editData.question_type === 'checkboxes';
      const options = needsOptions
        ? editData.options.filter(o => o.trim())
        : null;

      if (needsOptions && (!options || options.length < 2)) {
        alert('Multiple choice and checkbox questions need at least 2 options');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/campaigns/${campaignId}/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: editData.question_text,
          is_required: editData.is_required,
          options,
        }),
      });

      if (response.ok) {
        const { question } = await response.json();
        setQuestions(questions.map(q => q.id === questionId ? question : q));
        cancelEdit();
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
    setLoading(false);
  };

  const addQuestion = async () => {
    if (!newQuestion.question_text.trim()) return;

    setLoading(true);
    try {
      const needsOptions = newQuestion.question_type === 'multiple_choice' || newQuestion.question_type === 'checkboxes';
      const options = needsOptions
        ? newQuestion.options.filter(o => o.trim())
        : null;

      if (needsOptions && (!options || options.length < 2)) {
        alert('Multiple choice and checkbox questions need at least 2 options');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/campaigns/${campaignId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          is_required: newQuestion.is_required,
          options,
        }),
      });

      if (response.ok) {
        const { question } = await response.json();
        setQuestions([...questions, question]);
        setNewQuestion({
          question_text: '',
          question_type: 'text',
          is_required: false,
          options: ['', ''],
        });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Error adding question:', error);
    }
    setLoading(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setDeleteConfirm({ isOpen: true, questionId });
  };

  const confirmDeleteQuestion = async () => {
    const questionId = deleteConfirm.questionId;
    setDeleteConfirm({ isOpen: false, questionId: '' });

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) return;
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const addEditOption = () => {
    setEditData({
      ...editData,
      options: [...editData.options, ''],
    });
  };

  const updateEditOption = (index: number, value: string) => {
    const newOptions = [...editData.options];
    newOptions[index] = value;
    setEditData({ ...editData, options: newOptions });
  };

  const removeEditOption = (index: number) => {
    if (editData.options.length <= 2) return;
    const newOptions = editData.options.filter((_, i) => i !== index);
    setEditData({ ...editData, options: newOptions });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Question"
        message="Delete this question? Any existing answers will also be deleted."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteConfirm({ isOpen: false, questionId: '' })}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Custom Questions</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Question
          </button>
        )}
      </div>

      {/* Existing Questions */}
      {questions.length === 0 && !isAdding && (
        <p className="text-gray-500 text-sm">No custom questions yet. Add questions to collect additional information from respondents.</p>
      )}

      <div className="space-y-3">
        {questions.map((q, index) => (
          <div key={q.id}>
            {editingId === q.id ? (
              /* Edit Form */
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-gray-900 mb-3">Edit Question</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                    <select
                      value={editData.question_type}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500"
                    >
                      <option value="text">Free Text</option>
                      <option value="multiple_choice">Multiple Choice (select one)</option>
                      <option value="checkboxes">Checkboxes (select multiple)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Question type cannot be changed after creation</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                    <input
                      type="text"
                      value={editData.question_text}
                      onChange={(e) => setEditData({ ...editData, question_text: e.target.value })}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {(editData.question_type === 'multiple_choice' || editData.question_type === 'checkboxes') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                      <div className="space-y-2">
                        {editData.options.map((opt, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateEditOption(idx, e.target.value)}
                              placeholder={`Option ${idx + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            {editData.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeEditOption(idx)}
                                className="text-red-600 hover:text-red-700 px-2"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEditOption}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.is_required}
                      onChange={(e) => setEditData({ ...editData, is_required: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required question</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(q.id)}
                      disabled={loading || !editData.question_text.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Display View */
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        q.question_type === 'text'
                          ? 'bg-gray-100 text-gray-600'
                          : q.question_type === 'multiple_choice'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {q.question_type === 'text'
                          ? 'Text'
                          : q.question_type === 'multiple_choice'
                          ? 'Multiple Choice'
                          : 'Checkboxes'}
                      </span>
                      {q.is_required && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">Required</span>
                      )}
                    </div>
                    <p className="mt-1 text-gray-900">{q.question_text}</p>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {q.options.map((opt, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(q)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question Form */}
      {isAdding && (
        <div className="mt-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h3 className="font-medium text-gray-900 mb-3">New Question</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
              <select
                value={newQuestion.question_type}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as 'text' | 'multiple_choice' | 'checkboxes' })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Free Text</option>
                <option value="multiple_choice">Multiple Choice (select one)</option>
                <option value="checkboxes">Checkboxes (select multiple)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter your question..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(newQuestion.question_type === 'multiple_choice' || newQuestion.question_type === 'checkboxes') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                <div className="space-y-2">
                  {newQuestion.options.map((opt, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      {newQuestion.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-700 px-2"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            )}

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newQuestion.is_required}
                onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Required question</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={addQuestion}
                disabled={loading || !newQuestion.question_text.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Question'}
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
