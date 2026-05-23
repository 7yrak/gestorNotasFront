export interface User {
  userId: string;
  username: string;
  email: string;
}

export interface Notebook {
  notebookId: string;
  userId: string;
  name: string;
  color: string;
  isDeleted: boolean;
  orderInUser: number;
}

export interface Section {
  sectionId: string;
  notebookId: string;
  sectionGroupId?: string | null;
  name: string;
  color: string;
  isDeleted: boolean;
  orderInParent: number;
}

export interface Page {
  pageId: string;
  sectionId: string;
  parentPageId?: string | null;
  title: string;
  isDeleted: boolean;
  orderInSection: number;
  lastModifiedByUserId: string;
  version: number;
}

export interface PageContentBlock {
  contentBlockId?: string;
  pageId: string;
  type: 'text' | 'code_block' | 'table' | 'image';
  contentData: string; // Payload JSON estructurado para el campo JSONB de la BD
  orderOnPage: number;
  lastModifiedByUserId: string;
}
