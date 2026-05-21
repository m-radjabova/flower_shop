import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiArrowUpTray,
  HiCheckBadge,
  HiOutlineArrowRight,
  HiOutlinePencilSquare,
  HiPhoto,
  HiStar,
  HiXMark,
} from "react-icons/hi2";
import { getStoredAccessToken } from "../../api/authStorage";
import { useCreateReview, useReviews, useUploadImage } from "../../hooks/useCatalog";
import type { Bouquet, Review } from "../../types/catalog";
import { ReviewsPanelSkeleton } from "../PageSkeletons";

interface ReviewSectionProps {
  bouquet: Bouquet;
  mode?: "preview" | "full";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[#f2b15e]">
      {Array.from({ length: 5 }).map((_, index) => (
        <HiStar key={index} className={index < value ? "opacity-100" : "opacity-25"} />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-[1.6rem] border border-[#5d2d29] bg-[#120708] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{review.user.full_name}</h3>
            {review.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#163522] px-2.5 py-1 text-xs font-semibold text-[#9ff0b4]">
                <HiCheckBadge />
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[#9f7d76]">{formatDate(review.created_at)}</p>
        </div>
        <RatingStars value={review.rating} />
      </div>

      {review.text ? <p className="mt-4 leading-7 text-[#dbc0b9]">{review.text}</p> : null}
      {review.image ? (
        <img
          src={review.image}
          alt={`${review.user.full_name} review`}
          className="mt-4 h-52 w-full rounded-[1.2rem] object-cover"
        />
      ) : null}
    </article>
  );
}

function ReviewForm({ bouquet, embedded = false }: { bouquet: Bouquet; embedded?: boolean }) {
  const [rating, setRating] = useState(5);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const { register, handleSubmit, reset } = useForm<{ text: string }>({
    defaultValues: { text: "" },
  });
  const createReview = useCreateReview();
  const uploadImage = useUploadImage();
  const isLoggedIn = Boolean(getStoredAccessToken());

  const handleFileUpload = (file: File | undefined) => {
    if (!file) {
      return;
    }

    uploadImage.mutate(file, {
      onSuccess: (uploadedImage) => {
        setUploadedImageUrl(uploadedImage.url);
        toast.success("Rasm yuklandi");
      },
      onError: () => {
        toast.error("Rasm yuklashda xatolik bo'ldi");
      },
    });
  };

  if (!isLoggedIn) {
    return (
      <div
        className={
          embedded
            ? "rounded-[1.5rem] border border-[#6b3732] bg-[#100607]/70 p-6"
            : "rounded-[1.7rem] border border-[#68413b] bg-[linear-gradient(145deg,#1b0a0b,#2a1011)] p-6"
        }
      >
        <p className="font-cormorant text-3xl text-white">Share your experience</p>
        <p className="mt-2 leading-7 text-[#d3b4ad]">
          Review yozish uchun accountga kiring. Keyin yulduzcha bosib fikringizni qoldira olasiz.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fff3e8] px-5 py-3 text-sm font-bold text-[#541714] transition hover:bg-white"
        >
          Login to review
          <HiOutlineArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => {
        createReview.mutate(
          {
            shop_id: bouquet.shop_id,
            bouquet_id: bouquet.id,
            rating,
            text: values.text.trim() || undefined,
            image: uploadedImageUrl || undefined,
          },
          {
            onSuccess: () => {
              setRating(5);
              reset({ text: "" });
              setUploadedImageUrl("");
              toast.success("Review qo'shildi, rahmat!");
            },
            onError: () => {
              toast.error("Review yuborishda xatolik bo'ldi");
            },
          },
        );
      })}
      className={
        embedded
          ? "rounded-[1.5rem] border border-[#6b3732] bg-[#100607]/70 p-5 sm:p-6"
          : "rounded-[1.7rem] border border-[#68413b] bg-[linear-gradient(145deg,#1b0a0b,#2a1011)] p-6"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#ffc8bc]">
          <HiOutlinePencilSquare />
          <p className="font-semibold">Write a review</p>
        </div>
        <span className="rounded-full border border-[#7b413a] bg-[#1b0a0b] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#caa9a1]">
          Takes 30 sec
        </span>
      </div>
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => setRating(starValue)}
              className={`text-3xl transition hover:scale-110 ${
                starValue <= rating ? "text-[#f2b15e]" : "text-[#6f4c45]"
              }`}
              aria-label={`${starValue} stars`}
            >
              <HiStar />
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <textarea
          {...register("text")}
          placeholder="Bu bouquet sizga nimasi bilan yoqdi?"
          className="min-h-44 w-full resize-none rounded-[1.25rem] border border-[#5d2d29] bg-[#080304] px-4 py-3 leading-7 text-white outline-none transition placeholder:text-[#8d6b64] focus:border-[#d48479]"
        />
        <label
          className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed px-5 py-6 text-center transition ${
          uploadImage.isPending
            ? "border-[#94665d] bg-[#1a0a0b]"
            : "border-[#7b413a] bg-[radial-gradient(circle_at_top,rgba(122,47,42,0.34),rgba(16,6,7,0.92))] hover:border-[#d48479]"
        }`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={uploadImage.isPending}
            onChange={(event) => handleFileUpload(event.target.files?.[0])}
            className="sr-only"
          />
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff3e8] text-2xl text-[#5b1715] shadow-[0_14px_30px_rgba(0,0,0,0.24)]">
            {uploadImage.isPending ? <HiArrowUpTray className="animate-bounce" /> : <HiPhoto />}
          </span>
          <span className="mt-4 font-semibold text-white">
            {uploadImage.isPending ? "Uploading to ImageKit..." : "Upload review photo"}
          </span>
          <span className="mt-1 text-sm leading-6 text-[#b9968f]">
            JPG, PNG, WEBP yoki GIF. Maksimum 6MB.
          </span>
        </label>
      </div>
      {uploadedImageUrl ? (
        <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-[#7b413a] bg-[#100607]">
          <div className="relative">
            <img src={uploadedImageUrl} alt="Uploaded review" className="h-56 w-full object-cover" />
            <button
              type="button"
              onClick={() => setUploadedImageUrl("")}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              aria-label="Remove uploaded image"
            >
              <HiXMark />
            </button>
          </div>
          <p className="px-4 py-3 text-sm text-[#b9968f]">
            ImageKit upload tayyor. Review yuborilganda shu rasm birga saqlanadi.
          </p>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={createReview.isPending || uploadImage.isPending}
        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createReview.isPending ? "Sending..." : "Submit review"}
      </button>
    </form>
  );
}

function ReviewSection({ bouquet, mode = "preview" }: ReviewSectionProps) {
  const reviewsQuery = useReviews({ bouquetId: bouquet.id });
  const reviews = reviewsQuery.data ?? [];
  const isFullMode = mode === "full";

  if (!isFullMode) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-[#c39890]">Customer love</p>
            <h2 className="mt-3 font-cormorant text-5xl leading-none text-white sm:text-6xl">
              Tell us about {bouquet.name}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-[#caa9a1]">
              Yulduzcha bosing, qisqa fikr qoldiring va xohlasangiz rasm yuklang. Sizning review keyingi xaridorlarga yordam beradi.
            </p>
          </div>

          <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[#713934] bg-[linear-gradient(135deg,rgba(35,10,12,0.98),rgba(12,4,5,0.96)_48%,rgba(75,18,20,0.86))] p-4 shadow-[0_30px_95px_rgba(0,0,0,0.38)] sm:p-5 lg:grid lg:grid-cols-[0.78fr_1.22fr] lg:gap-5">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#c72f42]/20 blur-3xl" />
            <div className="relative rounded-[1.55rem] border border-[#7b413a] bg-[radial-gradient(circle_at_30%_20%,rgba(255,197,148,0.14),transparent_36%),linear-gradient(160deg,#2a0d10,#120607)] p-6">
              <span className="inline-flex rounded-full border border-[#8e4c45] bg-[#120607] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffc8bc]">
                Bouquet score
              </span>
              <div className="mt-8 flex items-end gap-4">
                <p className="text-7xl font-black leading-none text-white">{bouquet.rating}</p>
                <div className="pb-2">
                  <RatingStars value={Math.round(Number(bouquet.rating))} />
                  <p className="mt-2 text-sm font-semibold text-[#caa9a1]">
                    {bouquet.reviews_count} approved reviews
                  </p>
                </div>
              </div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#321214]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ffb36a] via-[#ff7d69] to-[#c82f43]"
                  style={{ width: `${Math.min(Number(bouquet.rating) * 20, 100)}%` }}
                />
              </div>
              <Link
                to={`/bouquets/${bouquet.id}/reviews`}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#9d5149] bg-[#120607]/70 px-5 py-4 text-sm font-bold text-[#ffe1d8] transition hover:border-[#f0a093] hover:text-white"
              >
                View all reviews
                <HiOutlineArrowRight />
              </Link>
            </div>

            <div className="relative mt-5 lg:mt-0">
              <ReviewForm bouquet={bouquet} embedded />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#b58e86]">Customer love</p>
          <h2 className="mt-2 font-cormorant text-5xl text-white">Reviews for {bouquet.name}</h2>
          <div className="mt-5 rounded-[1.7rem] border border-[#5d2d29] bg-[#120708] p-6">
            <div className="flex items-end gap-3">
              <p className="text-5xl font-bold text-white">{bouquet.rating}</p>
              <div className="pb-1">
                <RatingStars value={Math.round(Number(bouquet.rating))} />
                <p className="mt-1 text-sm text-[#b9978f]">{bouquet.reviews_count} approved reviews</p>
              </div>
            </div>
          </div>
          <Link
            to={`/bouquets/${bouquet.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#7a3d37] px-5 py-3 text-sm font-bold text-[#ffe1d8] transition hover:border-[#d48479] hover:text-white"
          >
            Write a review on bouquet page
            <HiOutlineArrowRight />
          </Link>
        </div>

        <div className="space-y-4">
          {reviewsQuery.isLoading ? (
            <ReviewsPanelSkeleton />
          ) : reviews.length ? (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-[#68413b] bg-[#120708] p-8 text-center">
              <p className="font-cormorant text-4xl text-white">No reviews yet</p>
              <p className="mt-3 text-[#caa9a1]">Birinchi review sizdan bo'lishi mumkin.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ReviewSection;
