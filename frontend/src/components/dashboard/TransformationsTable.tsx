import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { recentTransformations } from "../../data/mockData";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { StatusBadge } from "../ui/Badge";
import { SearchBar } from "../ui/SearchBar";
import { Button } from "../ui/Button";

type SortField = "user" | "style" | "status" | "date" | "duration";
type SortDir = "asc" | "desc";

export const TransformationsTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = recentTransformations
    .filter(
      (row) =>
        row.user.toLowerCase().includes(search.toLowerCase()) ||
        row.style.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField as keyof typeof a] || "";
      const bVal = b[sortField as keyof typeof b] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const SortBtn: React.FC<{ field: SortField; label: string }> = ({
    field,
    label,
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white transition-colors group"
    >
      {label}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {sortField === field ? (
          sortDir === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} />
        )}
      </span>
    </button>
  );

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Recent Transformations</CardTitle>
            <CardDescription>
              {filtered.length} total records
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SearchBar
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-44"
            />
            <Button variant="secondary" size="sm">
              <Filter size={14} /> Filter
            </Button>
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-3">
                  <SortBtn field="user" label="User" />
                </th>
                <th className="text-left py-3 px-3">
                  <SortBtn field="style" label="Style" />
                </th>
                <th className="text-left py-3 px-3">
                  <SortBtn field="status" label="Status" />
                </th>
                <th className="text-left py-3 px-3">
                  <SortBtn field="date" label="Date" />
                </th>
                <th className="text-left py-3 px-3">
                  <SortBtn field="duration" label="Duration" />
                </th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paged.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group hover:bg-white/3 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar fallback={row.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-white text-sm">
                          {row.user}
                        </p>
                        <p className="text-xs text-white/40">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/70">
                      {row.style}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3 px-3 text-xs text-white/50">
                    {row.date}
                  </td>
                  <td className="py-3 px-3 text-xs text-white/50 font-mono">
                    {row.duration}
                  </td>
                  <td className="py-3 px-3">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/40">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? "bg-violet-600 text-white"
                      : "text-white/50 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
