import { useState, useMemo, useCallback } from "react";
import type { KeyInfo } from "../types";

interface TreeNode {
  name: string;
  fullPath: string;
  children: Map<string, TreeNode>;
  keyInfo?: KeyInfo; // Only leaf nodes have keyInfo
}

interface KeyTreeProps {
  keys: KeyInfo[];
  onKeyClick?: (key: string, type: string) => void;
  onKeyContextMenu?: (key: string, type: string) => void;
}

function buildTree(keys: KeyInfo[]): TreeNode {
  const root: TreeNode = { name: "", fullPath: "", children: new Map() };

  for (const keyInfo of keys) {
    const parts = keyInfo.key.split(":");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children.has(part)) {
        const childPath = parts.slice(0, i + 1).join(":");
        current.children.set(part, {
          name: part,
          fullPath: childPath,
          children: new Map(),
          keyInfo: isLast ? keyInfo : undefined,
        });
      } else if (isLast) {
        // Key matches a prefix that already exists as a folder
        const existing = current.children.get(part)!;
        existing.keyInfo = keyInfo;
      }

      current = current.children.get(part)!;
    }

    // If key has no colons, it's a top-level leaf
    if (parts.length === 1) {
      current = root;
      if (!current.children.has(parts[0])) {
        current.children.set(parts[0], {
          name: parts[0],
          fullPath: parts[0],
          children: new Map(),
          keyInfo,
        });
      } else {
        current.children.get(parts[0])!.keyInfo = keyInfo;
      }
    }
  }

  return root;
}

function TreeNodeRow({
  node,
  depth,
  onKeyClick,
  onKeyContextMenu,
  expandedPaths,
  toggleExpand,
}: {
  node: TreeNode;
  depth: number;
  onKeyClick?: (key: string, type: string) => void;
  onKeyContextMenu?: (key: string, type: string) => void;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
}) {
  const isLeaf = node.children.size === 0;
  const isExpanded = expandedPaths.has(node.fullPath);
  const hasChildren = node.children.size > 0;
  const paddingLeft = depth * 16 + 8;

  const sortedChildren = useMemo(
    () =>
      [...node.children.values()].sort((a, b) => {
        // Folders before leaves
        const aHasChildren = a.children.size > 0 ? 0 : 1;
        const bHasChildren = b.children.size > 0 ? 0 : 1;
        if (aHasChildren !== bHasChildren) return aHasChildren - bHasChildren;
        return a.name.localeCompare(b.name);
      }),
    [node.children]
  );

  const handleClick = () => {
    if (hasChildren) {
      toggleExpand(node.fullPath);
    } else if (node.keyInfo) {
      onKeyClick?.(node.keyInfo.key, node.keyInfo.type);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (node.keyInfo) {
      e.preventDefault();
      onKeyContextMenu?.(node.keyInfo.key, node.keyInfo.type);
    }
  };

  return (
    <>
      <div
        className="flex cursor-pointer items-center border-b border-zinc-100 py-1.5 pr-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse chevron */}
        <span className="mr-1 w-4 shrink-0 text-center text-zinc-400">
          {hasChildren ? (
            <svg
              className={`inline h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : null}
        </span>

        {/* Icon */}
        <span className="mr-2 shrink-0">
          {hasChildren ? (
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
        </span>

        {/* Name */}
        <span className="truncate font-mono text-sm text-zinc-800 dark:text-zinc-200">{node.name}</span>

        {/* Type badge for leaf keys */}
        {isLeaf && node.keyInfo && (
          <span className="ml-2 inline-flex shrink-0 items-center rounded-full bg-red-900/50 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
            {node.keyInfo.type.toUpperCase()}
          </span>
        )}

        {/* Key count for folders */}
        {hasChildren && (
          <span className="ml-2 shrink-0 text-[10px] text-zinc-400">{node.children.size}</span>
        )}

        {/* TTL for leaf keys */}
        {isLeaf && node.keyInfo && (
          <span className="ml-auto shrink-0 pl-4 text-xs text-zinc-400">
            {node.keyInfo.ttl === -1 ? "" : `${node.keyInfo.ttl}s`}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded &&
        sortedChildren.map((child) => (
          <TreeNodeRow
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            onKeyClick={onKeyClick}
            onKeyContextMenu={onKeyContextMenu}
            expandedPaths={expandedPaths}
            toggleExpand={toggleExpand}
          />
        ))}
    </>
  );
}

export function KeyTree({ keys, onKeyClick, onKeyContextMenu }: KeyTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(keys), [keys]);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>();
    const collect = (node: TreeNode) => {
      if (node.children.size > 0) {
        allPaths.add(node.fullPath);
        for (const child of node.children.values()) {
          collect(child);
        }
      }
    };
    collect(tree);
    setExpandedPaths(allPaths);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const sortedRoot = useMemo(
    () =>
      [...tree.children.values()].sort((a, b) => {
        const aHasChildren = a.children.size > 0 ? 0 : 1;
        const bHasChildren = b.children.size > 0 ? 0 : 1;
        if (aHasChildren !== bHasChildren) return aHasChildren - bHasChildren;
        return a.name.localeCompare(b.name);
      }),
    [tree.children]
  );

  if (keys.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-400">
        No keys found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
        <button
          onClick={expandAll}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Expand All
        </button>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <button
          onClick={collapseAll}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Collapse All
        </button>
        <span className="ml-auto text-xs text-zinc-400">{keys.length} keys</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedRoot.map((node) => (
          <TreeNodeRow
            key={node.fullPath}
            node={node}
            depth={0}
            onKeyClick={onKeyClick}
            onKeyContextMenu={onKeyContextMenu}
            expandedPaths={expandedPaths}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
