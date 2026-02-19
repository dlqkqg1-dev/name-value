"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PRIMARY_PINK = "#ffafcc";
const SECONDARY_BLUE = "#bde0fe";

function isKoreanName(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 4) return false;
  // 한글 음절 범위 체크
  return /^[가-힣]+$/.test(trimmed);
}

function createDeterministicHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatMarketCap(value) {
  return `${value.toLocaleString("ko-KR")}억`;
}

const famousPeople = {
  김민수: ["프로야구 선수, 배우 등 다양한 동명이인"],
  김민지: ["아나운서, 가수 등 방송인 다수"],
  이지은: ["가수 아이유(본명 이지은)"],
  박지성: ["전 축구선수, 맨체스터 유나이티드 미드필더"],
  김연아: ["피겨 스케이팅 선수, '피겨 여왕'"],
  정국: ["BTS 멤버 정국(본명 전정국)"],
  지민: ["BTS 멤버 지민(본명 박지민)"],
};

const comments = [
  "이름만 봐도 재능이 뚝뚝 떨어집니다.",
  "투자자들이 줄 서서 기다리는 이름이에요.",
  "조용히 있지만 존재감은 시가총액 상위권입니다.",
  "이름만으로도 이미 브랜드 완성!",
  "꾸준히 올라가는 우상향 차트 같은 이름입니다.",
  "한 번 들으면 잊히지 않는 강렬한 이름이에요.",
  "안정적인 배당주 같은 든든한 느낌의 이름입니다.",
  "성장성과 안정성을 모두 잡은 이름이네요.",
  "이름값만큼이나 매력적인 사람이겠어요.",
  "이름만 보고도 '대박'이 느껴집니다.",
];

function getGrade(score) {
  const normalized = score % 100;
  if (normalized >= 90) return "S";
  if (normalized >= 75) return "A";
  if (normalized >= 55) return "B";
  if (normalized >= 35) return "C";
  return "D";
}

function getComment(hash) {
  const index = hash % comments.length;
  return comments[index];
}

function getFamousPeople(name) {
  if (famousPeople[name]) {
    return famousPeople[name];
  }
  return [];
}

function calculateNameValue(name) {
  const trimmed = name.trim();
  const hash = createDeterministicHash(trimmed);

  const marketCap = 100 + (hash % 9900); // 100 ~ 9999억
  const grade = getGrade(hash);
  const comment = getComment(hash);
  const sameName = getFamousPeople(trimmed);

  return {
    marketCap,
    grade,
    comment,
    sameName,
  };
}

function useCountUp(target, durationMs) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }

    let animationFrame;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const nextValue = Math.round(target * eased);
      setValue(nextValue);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [target, durationMs]);

  return value;
}

const gradeStyles = {
  S: {
    label: "S",
    backgroundColor: "#FFD700",
  },
  A: {
    label: "A",
    backgroundColor: "#7C3AED",
  },
  B: {
    label: "B",
    backgroundColor: "#3B82F6",
  },
  C: {
    label: "C",
    backgroundColor: "#22C55E",
  },
  D: {
    label: "D",
    backgroundColor: "#9CA3AF",
  },
};

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") ?? "";

  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef(null);

  const hasResult = useMemo(
    () => isKoreanName(initialName),
    [initialName],
  );

  const result = useMemo(() => {
    if (!hasResult) return null;
    return calculateNameValue(initialName);
  }, [hasResult, initialName]);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!isKoreanName(name)) {
        setError("한글 이름 2~4글자를 입력해 주세요.");
        return;
      }
      setError("");
      setIsSubmitting(true);
      const params = new URLSearchParams(window.location.search);
      params.set("name", name.trim());
      router.push(`/?${params.toString()}`);
      setTimeout(() => setIsSubmitting(false), 300);
    },
    [name, router],
  );

  const handleReset = useCallback(() => {
    setName("");
    setError("");
    const params = new URLSearchParams(window.location.search);
    params.delete("name");
    router.push(`/?${params.toString()}`);
  }, [router]);

  const handleShare = useCallback(async () => {
    try {
      if (!result || !cardRef.current) return;

      const domtoimage = (await import("dom-to-image-more")).default;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const dataUrl = await domtoimage.toPng(cardRef.current, {
        scale: 2,
        bgcolor: "#f8f8f8",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${initialName || name || "이름"}_이름값.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("이미지 저장 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [initialName, name, result]);

  const animatedMarketCap = useCountUp(
    result?.marketCap ?? 0,
    1500,
  );

  return (
    <div className="min-h-screen w-full px-4 py-10 flex items-center justify-center">
      <main className="w-full max-w-md">
        <div className="mb-8 flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#666] w-fit">
            <span className="text-base">💰</span>
            <span>이름으로 보는 시가총액</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#111]">
            이름값 계산기
          </h1>
          <p className="text-sm text-[#666] leading-relaxed">
            한글 이름 2~4글자를 입력하면,
            <br />
            이름 시가총액부터 동명이인까지 한 번에 확인해 보세요.
          </p>
        </div>

        {!hasResult && (
          <section className="rounded-3xl bg-white shadow-sm border border-[#eee] px-6 py-7 flex flex-col gap-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#333] flex items-center justify-between">
                  <span>이름 입력</span>
                  <span className="text-xs text-[#999]">한글 2~4글자</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="예) 김민수"
                  maxLength={4}
                  className="h-11 rounded-xl border border-[#ddd] px-3 text-sm text-[#111] outline-none focus:border-[${PRIMARY_PINK}] focus:ring-2 focus:ring-[${PRIMARY_PINK}] focus:ring-offset-0 transition-shadow bg-[#fafafa]"
                />
              </label>
              {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#ffafcc] text-sm font-semibold text-[#111] shadow-sm transition hover:brightness-95 disabled:opacity-50 disabled:hover:brightness-100"
              >
                {isSubmitting ? "계산 중..." : "이름값 계산하기"}
              </button>
            </form>

            <p className="text-[11px] text-[#999] leading-relaxed">
              입력한 이름은 서버에 저장되지 않고,
              <br />
              브라우저 안에서만 안전하게 계산돼요.
            </p>
          </section>
        )}

        {hasResult && result && (
          <section className="space-y-4">
            <div ref={cardRef} className="mt-2 rounded-[16px] border border-[#e0e0e0] bg-[#f8f8f8] px-6 py-7 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-[#ffafcc] to-[#bde0fe] rounded-full mb-4" />
              <div className="mb-5 flex justify-between">
                <div>
                  <div className="inline-block rounded-full bg-[#ffafcc] px-3 py-1 text-[11px] font-medium text-white">
                    ✨ 이름 포트폴리오
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#111]">
                      {initialName}
                    </h2>
                    <span className="text-xl" aria-hidden>
                      📈
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#999]">
                    name grade
                  </span>
                  {(() => {
                    const style = gradeStyles[result.grade] ?? gradeStyles.D;
                    return (
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full text-white font-bold text-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                        style={{ backgroundColor: style.backgroundColor }}
                        aria-label={`이름 등급 ${result.grade}`}
                      >
                        <span>{style.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-2">
                <span className="block text-xs font-medium text-[#555]">
                  이름 시가총액
                </span>
                <p className="mt-1 text-[11px] text-[#999]">
                  {result.grade === "S"
                    ? "시장 최상위권 프리미엄 이름입니다."
                    : result.grade === "A"
                    ? "탄탄한 성장성을 가진 우량 이름이에요."
                    : result.grade === "B"
                    ? "꾸준히 올라갈 잠재력이 큰 이름입니다."
                    : result.grade === "C"
                    ? "조용하지만 알찬 가치주 같은 이름이에요."
                    : "아직 저평가된 보석 같은 이름입니다."}
                </p>

                <div className="mt-4 text-center">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-[#999] mb-2">
                    market cap
                  </span>
                  <p className="text-5xl font-extrabold tracking-tight text-[#111] leading-none my-2">
                    {animatedMarketCap.toLocaleString("ko-KR")}억
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#f0f0f0] pt-4">
                <h3 className="text-xs font-semibold text-[#333] flex items-center gap-1.5">
                  <span>💡 한 줄 코멘트</span>
                </h3>
                <p className="mt-2 text-xs text-[#555] leading-relaxed">
                  {result.comment}
                </p>
              </div>

              <div className="mt-4 border-t border-[#f0f0f0] pt-4">
                <h3 className="text-xs font-semibold text-[#333] flex items-center gap-1.5">
                  <span>👥 동명이인 유명인</span>
                </h3>
                {result.sameName.length > 0 ? (
                  <ul className="mt-2 text-xs text-[#555] space-y-1.5 leading-relaxed">
                    {result.sameName.map((person) => (
                      <li key={person} className="flex items-start gap-2">
                        <span className="mt-[2px] text-[10px] text-[#999]">
                          •
                        </span>
                        <span>{person}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-[#999] leading-relaxed">
                    등록된 동명이인 정보가 없어요.{" "}
                    <span className="text-[#666]">
                      아마도 이 이름의 원조일지도요!
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#ffafcc] text-sm font-semibold text-[#111] shadow-sm transition hover:brightness-95"
              >
                📷 결과 카드 이미지로 저장하기
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#ddd] bg-white text-sm font-medium text-[#333] transition hover:bg-[#f5f5f5]"
              >
                ↩️ 다른 이름 계산하기
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
