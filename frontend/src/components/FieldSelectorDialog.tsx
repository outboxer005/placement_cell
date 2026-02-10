import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Search } from "lucide-react";
import type { FieldConfig } from "@/lib/exportUtils";

type FieldSelectorDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fields: FieldConfig[];
    onExport: (selectedFields: FieldConfig[]) => void;
    title?: string;
    description?: string;
};

export function FieldSelectorDialog({
    open,
    onOpenChange,
    fields,
    onExport,
    title = "Select Fields to Export",
    description = "Choose which columns to include in your Excel file",
}: FieldSelectorDialogProps) {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
        new Set(fields.filter(f => f.defaultSelected !== false).map(f => f.key))
    );
    const [searchQuery, setSearchQuery] = useState("");

    // Filter fields based on search query
    const filteredFields = useMemo(() => {
        if (!searchQuery.trim()) return fields;
        const query = searchQuery.toLowerCase();
        return fields.filter(field =>
            field.label.toLowerCase().includes(query) ||
            field.key.toLowerCase().includes(query)
        );
    }, [fields, searchQuery]);

    const toggleField = (key: string) => {
        const newSelected = new Set(selectedKeys);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedKeys(newSelected);
    };

    const toggleAll = () => {
        if (selectedKeys.size === fields.length) {
            setSelectedKeys(new Set());
        } else {
            setSelectedKeys(new Set(fields.map(f => f.key)));
        }
    };

    const handleExport = () => {
        const selectedFields = fields.filter(f => selectedKeys.has(f.key));
        if (selectedFields.length === 0) {
            return;
        }
        onExport(selectedFields);
        onOpenChange(false);
    };

    const allSelected = selectedKeys.size === fields.length;
    const someSelected = selectedKeys.size > 0 && selectedKeys.size < fields.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Select All Checkbox */}
                    <div className="flex items-center space-x-2 pb-2 border-b">
                        <Checkbox
                            id="select-all"
                            checked={allSelected}
                            onCheckedChange={toggleAll}
                            className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                        />
                        <Label
                            htmlFor="select-all"
                            className="text-sm font-semibold cursor-pointer"
                        >
                            {allSelected ? "Deselect All" : "Select All"}
                        </Label>
                    </div>

                    {/* Field List */}
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                            {filteredFields.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No fields found matching "{searchQuery}"
                                </p>
                            ) : (
                                filteredFields.map((field) => (
                                    <div key={field.key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={field.key}
                                            checked={selectedKeys.has(field.key)}
                                            onCheckedChange={() => toggleField(field.key)}
                                        />
                                        <Label
                                            htmlFor={field.key}
                                            className="text-sm font-normal cursor-pointer flex-1"
                                        >
                                            {field.label}
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Selected Count */}
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                        {selectedKeys.size} of {fields.length} fields selected
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={selectedKeys.size === 0}
                        className="gradient-primary"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
