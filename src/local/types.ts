export type LegalSection = {
  title: string
  body: string
}

export type LegalDocumentContent = {
  title: string
  description: string
  sections: LegalSection[]
}

export type LegalContentCollection = {
  terms: LegalDocumentContent
  privacy: LegalDocumentContent
}
