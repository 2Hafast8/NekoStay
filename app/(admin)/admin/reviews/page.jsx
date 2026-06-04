"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Star, Send, Sparkles, User, Calendar, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/dates";
import { useLanguage } from "@/hooks/useLanguage";

export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // States for replying
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);

  const supabase = createClient();

  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:user_id (full_name, phone, email),
          bookings:booking_id (
            id,
            cat_name,
            class,
            check_in_date,
            check_out_date
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error("Error fetching reviews list:", err);
      setErrorMsg(t("admin_rev_load_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleReplySubmit = async (e, bookingId) => {
    e.preventDefault();
    setErrorMsg(null);
    setReplySuccess(null);
    setIsSubmittingReply(true);

    try {
      const response = await fetch(`/api/reviews/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          replyText,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || t("admin_rev_reply_failed"));

      setReplySuccess(t("admin_rev_reply_success"));
      setReplyingToId(null);
      setReplyText("");
      loadReviews();
    } catch (err) {
      console.error("Error submitting review reply:", err);
      setErrorMsg(err.message || t("admin_rev_reply_failed"));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const reviewsPerPage = 8;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="h-8 bg-muted dark:bg-zinc-800/60 rounded-xl w-48 mb-4" />
        <div className="h-6 bg-muted dark:bg-zinc-800/60 rounded-xl w-96 mb-8" />
        <div className="h-64 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-background dark:bg-zinc-950 p-4 sm:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>{t("admin_rev_badge")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-zinc-50">
          {t("admin_rev_title")}
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          {t("admin_rev_subtitle")}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 rounded-2xl text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {replySuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-2xl text-xs font-bold">
          {replySuccess}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-muted dark:bg-zinc-800 rounded-3xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-card border border-border dark:border-zinc-800 p-12 text-center rounded-3xl">
          <MessageSquare className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            {t("admin_rev_empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {paginatedReviews.map((rev) => {
            const hasReply = !!rev.reply_text;
            const isReplying = replyingToId === rev.id;

            return (
              <div
                key={rev.id}
                className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-3xl p-6 hover:shadow-xs transition-shadow flex flex-col md:flex-row gap-6 justify-between items-start"
              >
                <div className="space-y-3 flex-1">
                  {/* Rating Stars and Date */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rev.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-zinc-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      {formatDate(rev.created_at, "long")}
                    </span>
                  </div>

                  {/* Customer and Cat Info */}
                  <div className="text-xs text-muted-foreground dark:text-zinc-400 font-semibold flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {rev.profiles?.full_name} ({rev.profiles?.phone || "-"})
                    </span>
                    <span className="h-3 w-px bg-border/80 dark:bg-zinc-800" />
                    <span>
                      {t("admin_rev_cat")}<strong className="text-foreground dark:text-zinc-200">{rev.bookings?.cat_name}</strong> ({rev.bookings?.class})
                    </span>
                  </div>

                  {/* Review Text */}
                  <div className="bg-muted/10 border border-border/60 dark:border-zinc-850 p-4 rounded-2xl">
                    {rev.review_text ? (
                      <p className="text-xs text-foreground dark:text-zinc-200 leading-relaxed font-medium">
                        "{rev.review_text}"
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t("admin_rev_no_text")}
                      </p>
                    )}
                  </div>

                  {/* Existing Reply Display */}
                  {hasReply && (
                    <div className="bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 p-4 rounded-2xl space-y-1.5 ml-4 md:ml-6">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                        {t("admin_rev_response_title")}
                      </span>
                      <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                        {rev.reply_text}
                      </p>
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, rev.booking_id)}
                      className="space-y-3 pt-2 ml-4 md:ml-6"
                    >
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                        {t("admin_rev_reply_email")}
                      </label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t("admin_rev_reply_placeholder")}
                        rows={3}
                        className="w-full text-xs p-3.5 border border-border/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary dark:bg-zinc-950 dark:border-zinc-800"
                        required
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText("");
                          }}
                          className="px-4 py-2 border border-border rounded-xl text-muted-foreground text-xs font-bold hover:bg-muted/10 transition-all cursor-pointer"
                        >
                          {t("admin_rev_btn_cancel")}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingReply}
                          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReply ? t("admin_rev_btn_sending") : t("admin_rev_btn_send")}
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Right Column: Actions */}
                <div className="flex flex-col gap-2 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-start">
                  <Link
                    href={`/admin/bookings/${rev.booking_id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-all cursor-pointer text-center"
                  >
                    <span>{t("admin_rev_btn_detail")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {!hasReply && !isReplying && (
                    <button
                      onClick={() => {
                        setReplyingToId(rev.id);
                        setReplyText("");
                      }}
                      className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all cursor-pointer text-center"
                    >
                      {t("admin_rev_btn_reply")}
                    </button>
                  )}

                  {hasReply && !isReplying && (
                    <button
                      onClick={() => {
                        setReplyingToId(rev.id);
                        setReplyText(rev.reply_text);
                      }}
                      className="px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:text-foreground text-xs font-bold hover:bg-muted/10 transition-all cursor-pointer text-center"
                    >
                      {t("admin_rev_btn_edit")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border dark:border-zinc-800 px-5 py-4 rounded-3xl mt-6">
              <p className="text-xs text-muted-foreground font-semibold">
                {t("pager_showing")} <span className="text-foreground dark:text-zinc-200">{Math.min(reviews.length, (currentPage - 1) * reviewsPerPage + 1)}</span> - <span className="text-foreground dark:text-zinc-200">{Math.min(reviews.length, currentPage * reviewsPerPage)}</span> {t("pager_of")} <span className="text-foreground dark:text-zinc-200">{reviews.length}</span> {t("pager_reviews")}
              </p>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-border dark:border-zinc-800 rounded-xl hover:bg-muted/80 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border dark:border-zinc-800 hover:bg-muted/80 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-border dark:border-zinc-800 rounded-xl hover:bg-muted/80 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
