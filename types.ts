
export enum GradeLevel {
  P1 = "السنة الأولى ابتدائي",
  P2 = "السنة الثانية ابتدائي",
  P3 = "السنة الثالثة ابتدائي",
  P4 = "السنة الرابعة ابتدائي",
  P5 = "السنة الخامسة ابتدائي",
  M1 = "السنة الأولى متوسط",
  M2 = "السنة الثانية متوسط",
  M3 = "السنة الثالثة متوسط",
  M4 = "السنة الرابعة متوسط",
  S1 = "السنة الأولى ثانوي",
  S2 = "السنة الثانية ثانوي",
  S3 = "السنة الثالثة ثانوي"
}

export type Subject = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export interface MindMapBranch {
  title: string;
  details: string[];
}

export interface MindMap {
  centralTopic: string;
  branches: MindMapBranch[];
}

export interface AssessmentCriterion {
  name: string;
  description: string;
}

export interface IntegrationTask {
  context: string;
  support: string;
  instructions: string[];
  assessmentCriteria: AssessmentCriterion[];
  imageUrl?: string;
}

export interface GenerationResponse {
  version1: IntegrationTask;
  version2: IntegrationTask;
  mindMap: MindMap;
}
