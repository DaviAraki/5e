import type { ReactNode } from "react";
import MobileBackBar from "./MobileBackBar";

/**
 * Responsive master-detail shell shared by every list page.
 *
 * - Desktop (md+): list pane (`listWidth`) and detail pane side by side.
 * - Mobile: list full-width; when `isMobileDetail` is true the detail pane
 *   slides over the list (`absolute inset-0 z-10`), with a back bar to return.
 */
export default function MasterDetailLayout({
  isMobileDetail,
  onBack,
  backLabel,
  listWidth,
  list,
  detail,
}: {
  isMobileDetail: boolean;
  onBack: () => void;
  backLabel: string;
  listWidth: string;
  list: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="flex h-full">
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle ${listWidth} shrink-0 md:border-r`}
      >
        {list}
      </aside>
      <section
        className={`${
          isMobileDetail ? "flex" : "hidden md:flex"
        } absolute inset-0 top-0 z-10 flex-1 flex-col overflow-hidden bg-bg md:static md:z-auto`}
      >
        <MobileBackBar label={backLabel} onClick={onBack} />
        <div className="flex-1 overflow-y-auto">{detail}</div>
      </section>
    </div>
  );
}
