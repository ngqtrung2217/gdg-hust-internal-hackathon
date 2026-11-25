import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-on-surface-variant",
        "prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-on-surface",
        "prose-p:leading-7 prose-strong:text-on-surface",
        "prose-a:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded prose-code:bg-surface-container prose-code:px-1.5 prose-code:py-0.5 prose-code:text-on-surface prose-code:before:content-none prose-code:after:content-none",
        "prose-blockquote:border-l-primary-container prose-blockquote:text-on-surface-variant",
        "prose-li:my-1",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        urlTransform={(url) => (/^https?:\/\//i.test(url) ? url : "")}
        components={{
          a: ({ href, children }) => {
            if (!href || !/^https?:\/\//i.test(href)) {
              return <span>{children}</span>;
            }

            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
                <ExternalLink
                  aria-hidden
                  className="ml-1 inline h-3 w-3 align-baseline"
                />
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
