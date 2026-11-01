export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 10;
export const DEFAULT_QUESTIONS = 3;

export type ChatMessage = {
  role: "interviewer" | "candidate";
  content: string;
};

export type QuestionFeedback = {
  question: string; // 該題題目（精簡）
  comment: string; // 對候選人回答的點評
  betterAnswer: string; // 較好的回答方式 / 示範回答
};

export type Evaluation = {
  score: number; // 0-100
  summary: string;
  strengths: string[];
  improvements: string[];
  questions: QuestionFeedback[];
};

export type InterviewRequest = {
  jobDescription: string;
  totalQuestions: number;
  messages: ChatMessage[];
};

export type InterviewResponse =
  | { type: "question"; message: string; questionNumber: number }
  | { type: "evaluation"; evaluation: Evaluation };
