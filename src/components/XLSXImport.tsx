import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ImportedRow {
  name?: string;
  email?: string;
  [key: string]: any;
}

interface XLSXImportProps {
  onImport: (data: ImportedRow[]) => void;
  templateColumns?: string[];
}

export const XLSXImport = ({ onImport, templateColumns = ["name", "email"] }: XLSXImportProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      processFile(droppedFile);
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const validExtensions = [".xlsx", ".xls"];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet);

      if (jsonData.length === 0) {
        toast.error("The file appears to be empty");
        resetState();
        return;
      }

      const cols = Object.keys(jsonData[0]);
      setColumns(cols);
      setPreview(jsonData.slice(0, 5)); // Show first 5 rows
      toast.success(`Found ${jsonData.length} rows in the file`);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file");
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      processFile(selectedFile);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview([]);
    setColumns([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet);
      
      onImport(jsonData);
      toast.success(`Successfully imported ${jsonData.length} records`);
      resetState();
    } catch (error) {
      toast.error("Failed to import data");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      Object.fromEntries(templateColumns.map((col) => [col, ""])),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import_template.xlsx");
    toast.success("Template downloaded!");
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInput}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-accent/30"
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-colors
                ${isDragging ? "bg-primary/10" : "bg-muted"}
              `}>
                <FileSpreadsheet size={24} className={isDragging ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {isDragging ? "Drop your file here" : "Upload Excel file"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports .xlsx and .xls files
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* File header */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.length > 0 && `${columns.length} columns • Preview of first 5 rows`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={resetState}>
                <X size={18} />
              </Button>
            </div>

            {/* Preview table */}
            {preview.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t border-border">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-foreground whitespace-nowrap">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 bg-muted/30 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={resetState}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template download */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle size={16} />
          <span>Need a template?</span>
        </div>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>
    </div>
  );
};
