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

export interface SectionGroup {
  sectionGroupId: string;
  notebookId: string;
  parentSectionGroupId?: string | null;
  name: string;
  isDeleted: boolean;
  orderInParent: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  tagId: string;
  userId: string;
  name: string;
  color?: string;
  createdAt?: string;
}

export interface Resource {
  resourceId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  createdAt?: string;
}

export interface BackupImportResult {
  notebooks: number;
  sections: number;
  pages: number;
  contentBlocks: number;
  tags: number;
  resources: number;
}
