"use client";

export interface RichTextBlockProps {
  html: string;
  className?: string;
}

export function RichTextBlock({ html, className = "" }: RichTextBlockProps) {
  return (
    <div
      className={`
        prose prose-invert max-w-none

        /* Headings */
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-4 [&_h1]:mt-8
        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mb-3 [&_h2]:mt-6
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-text-primary [&_h3]:mb-2 [&_h3]:mt-5
        [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-text-primary [&_h4]:mb-2 [&_h4]:mt-4
        [&_h5]:text-base [&_h5]:font-medium [&_h5]:text-text-primary [&_h5]:mb-2 [&_h5]:mt-3
        [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-text-primary [&_h6]:mb-2 [&_h6]:mt-3

        /* Paragraphs */
        [&_p]:text-text-secondary [&_p]:leading-relaxed [&_p]:mb-4

        /* Links */
        [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2
        [&_a:hover]:text-accent/80

        /* Strong and emphasis */
        [&_strong]:text-text-primary [&_strong]:font-semibold
        [&_em]:italic

        /* Lists */
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-text-secondary
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-text-secondary
        [&_li]:mb-1 [&_li]:leading-relaxed
        [&_li_ul]:mt-2 [&_li_ol]:mt-2

        /* Inline code */
        [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono
        [&_code]:bg-accent/10 [&_code]:text-accent [&_code]:rounded

        /* Code blocks */
        [&_pre]:bg-[#0d0d0d] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text-secondary

        /* Blockquotes */
        [&_blockquote]:border-l-4 [&_blockquote]:border-accent/50 [&_blockquote]:pl-4
        [&_blockquote]:italic [&_blockquote]:text-text-muted [&_blockquote]:my-4

        /* Horizontal rule */
        [&_hr]:border-border [&_hr]:my-8

        /* Images */
        [&_img]:rounded-lg [&_img]:my-4

        /* Tables (basic support) */
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
        [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-border
        [&_th]:text-text-primary [&_th]:font-semibold
        [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-border [&_td]:text-text-secondary

        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
