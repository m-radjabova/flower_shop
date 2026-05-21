import { Skeleton } from "./Skeleton";

function IsLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#4b0f17_0%,#190809_55%,#120506_100%)] px-6">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-[#bd2f45]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[#ed9b66]/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-[#7f2a35]/60 bg-[linear-gradient(160deg,rgba(35,11,16,0.88),rgba(12,5,8,0.88))] p-10 text-center shadow-[0_32px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <Skeleton className="mx-auto h-20 w-20 rounded-full border border-[#b14655]/45" />
        <Skeleton className="mx-auto mt-7 h-3 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-5 w-56 rounded-full" />
        <Skeleton className="mx-auto mt-3 h-5 w-44 rounded-full" />
        <Skeleton className="mx-auto mt-7 h-1.5 w-40 rounded-full" />
      </div>
    </div>
  );
}

export default IsLoading;
