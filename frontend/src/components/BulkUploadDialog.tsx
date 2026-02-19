import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface BulkUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete?: () => void;
}

interface UploadResult {
    ok: boolean;
    summary: {
        total: number;
        created: number;
        updated: number;
        failed: number;
    };
    errors?: Array<{ row: number; username: string; error: string }>;
}

export function BulkUploadDialog({ open, onOpenChange, onComplete }: BulkUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (selectedFile: File) => {
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (ext !== "csv" && ext !== "xlsx") {
            toast.error("Please select a CSV or Excel (.xlsx) file");
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setFile(selectedFile);
        setResult(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("auth_token");
            const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

            const response = await fetch(`${BASE_URL}/students/bulk-upload`, {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = (await response.json()) as any;
                throw new Error(errorData.error || "Upload failed");
            }

            const data = (await response.json()) as UploadResult;
            setResult(data);

            const { created, updated, failed } = data.summary;
            if (failed === 0) {
                toast.success(`Successfully processed ${created + updated} students (${created} new, ${updated} updated)`);
                if (onComplete) onComplete();
            } else {
                toast.warning(`Completed with errors: ${created + updated} success, ${failed} failed`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setFile(null);
            setResult(null);
            onOpenChange(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Bulk Upload Student Credentials</DialogTitle>
                    <DialogDescription>Upload a CSV or Excel file with Username (Registration ID) and Password</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!result ? (
                        <>
                            {/* File Upload Area */}
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400"
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />

                                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />

                                {file ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{file.name}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReset();
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-slate-600 mb-2">
                                            Drag and drop your file here, or click to browse
                                        </p>
                                        <p className="text-sm text-slate-500">Supports CSV and Excel (.xlsx) files up to 10MB</p>
                                    </>
                                )}
                            </div>

                            {/* Template Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
                                <p className="text-blue-900 font-semibold mb-2">📋 Required Columns (Only 2!):</p>
                                <div className="space-y-1">
                                    <p className="text-blue-800">
                                        1. <code className="bg-blue-100 px-2 py-0.5 rounded">Username</code> - Student Registration ID
                                    </p>
                                    <p className="text-blue-800">
                                        2. <code className="bg-blue-100 px-2 py-0.5 rounded">Password</code> - Student password
                                    </p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-xs text-blue-700 font-medium">📝 Example CSV file:</p>
                                    <pre className="text-xs bg-white p-2 rounded border border-blue-200 mt-1">
                                        Username,Password{"\n"}
                                        REG001,pass123{"\n"}
                                        REG002,secure456
                                    </pre>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Upload Results */
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-green-900">Success</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">
                                        {result.summary.created + result.summary.updated}
                                    </p>
                                    <p className="text-xs text-green-700">
                                        {result.summary.created} new, {result.summary.updated} updated
                                    </p>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <span className="font-semibold text-red-900">Failed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-700">{result.summary.failed}</p>
                                    <p className="text-xs text-red-700">Out of {result.summary.total} total</p>
                                </div>
                            </div>

                            {/* Error Details */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600" />
                                        <span className="font-semibold text-amber-900">Errors</span>
                                    </div>
                                    <div className="space-y-2">
                                        {result.errors.slice(0, 10).map((err, idx) => (
                                            <div key={idx} className="text-xs text-amber-800 border-b border-amber-200 pb-1">
                                                <span className="font-medium">Row {err.row}:</span> {err.username && `(${err.username}) `}
                                                {err.error}
                                            </div>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <p className="text-xs text-amber-700 italic">
                                                ... and {result.errors.length - 10} more errors
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={handleClose} disabled={uploading}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading ? "Uploading..." : "Upload"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleReset}>
                                Upload Another
                            </Button>
                            <Button onClick={handleClose}>Close</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
