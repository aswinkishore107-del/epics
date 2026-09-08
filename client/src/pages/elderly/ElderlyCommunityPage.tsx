import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { CommunityPost } from '../../types';
import {
  Users,
  Heart,
  MessageCircle,
  Pin,
  Send,
  Sparkles,
  Plus,
} from 'lucide-react';

export const ElderlyCommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const fetchPosts = () => {
    api.get('/community/posts')
      .then((res) => {
        if (res.data?.data) setPosts(res.data.data);
      })
      .catch((err) => console.error('Error fetching community posts:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: res.data.liked,
              likesCount: res.data.liked ? p.likesCount + 1 : p.likesCount - 1,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await api.post('/community/posts', { title, content, category: 'DAILY_WINS' });
      setTitle('');
      setContent('');
      setShowNewPost(false);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/community/posts/${postId}/comment`, { content: text });
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 text-teal-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Users className="w-4 h-4" />
            <span>Closed Senior Community</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">VIORA Community Circle</h1>
          <p className="text-teal-100/90 text-base mt-1">
            Share gentle daily wins, healthy tips, and uplifting moments with friends and doctors.
          </p>
        </div>

        <button
          onClick={() => setShowNewPost(true)}
          className="bg-white text-teal-900 hover:bg-teal-50 font-bold text-base px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Share a Win</span>
        </button>
      </div>

      {/* New Post Creator Modal */}
      {showNewPost && (
        <div className="bg-white rounded-3xl p-6 border-2 border-teal-500 shadow-xl animate-in fade-in">
          <h3 className="text-2xl font-black text-slate-900 mb-3">Share With the Community</h3>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g., Completed my 4,000 steps today!)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            />
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What made your day pleasant?"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-base text-slate-900 focus:outline-none focus:border-teal-500"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewPost(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md"
              >
                Publish Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed Stream */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading community updates...</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="elderly-card space-y-4">
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Pin className="w-3.5 h-3.5" /> Pinned Doctor Tip
                </span>
              )}

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0">
                  {post.author.firstName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {post.author.firstName} {post.author.lastName}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {post.author.role}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">{post.title}</h3>
                <p className="text-base text-slate-700 mt-2 leading-relaxed">{post.content}</p>
              </div>

              {/* Likes & Comments Toolbar */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                    post.hasLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.hasLiked ? 'fill-current' : ''}`} />
                  <span>{post.likesCount} Likes</span>
                </button>

                <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.commentsCount} Comments</span>
                </span>
              </div>

              {/* Comment Thread */}
              {post.comments && post.comments.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200/80">
                  {post.comments.map((c, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-bold text-slate-900">{c.author.firstName}: </span>
                      <span className="text-slate-700">{c.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  placeholder="Add a kind word..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
