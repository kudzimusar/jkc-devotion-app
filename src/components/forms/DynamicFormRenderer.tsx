"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface FormTemplate {
    id: string;
    org_id: string;
    ministry_id: string | null;
    name: string;
    report_type: string;
    description: string | null;
    fields: FormField[];
    is_active: boolean;
    version: number;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'date' | 'select' | 'boolean' | 'multi_select' | 'children_table';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

interface DynamicFormRendererProps {
    template: FormTemplate;
    ministryId: string;
    onSuccess?: () => void;
}

export default function DynamicFormRenderer({ template, ministryId, onSuccess }: DynamicFormRendererProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChildrenTableChange = (name: string, index: number, field: string, value: any) => {
        setFormData(prev => {
            const currentArray = [...(prev[name] || [])];
            if (!currentArray[index]) {
                currentArray[index] = {};
            }
            currentArray[index][field] = value;
            return { ...prev, [name]: currentArray };
        });
    };

    const addChildrenTableRow = (name: string) => {
        setFormData(prev => {
            const currentArray = [...(prev[name] || [])];
            currentArray.push({});
            return { ...prev, [name]: currentArray };
        });
    };

    const removeChildrenTableRow = (name: string, index: number) => {
        setFormData(prev => {
            const currentArray = [...(prev[name] || [])];
            currentArray.splice(index, 1);
            return { ...prev, [name]: currentArray };
        });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data } = await supabase.auth.getSession();
            const session = data?.session;
            if (!session?.user) throw new Error("Not authenticated");

            // Extract service_date if it exists in the top-level form data, otherwise use today
            let serviceDate = new Date().toISOString().split('T')[0];
            if (formData['service_date']) {
                serviceDate = formData['service_date'];
            }

            // Remove service_date from JSONB data so it's not duplicated (optional, but cleaner)
            const jsonbData = { ...formData };

            // Determine report status (some forms have a status field)
            const status = formData['status'] || 'submitted';

            const { error } = await supabase.from('ministry_reports').insert({
                org_id: template.org_id,
                ministry_id: ministryId,
                submitted_by: session.user.id,
                report_type: template.report_type,
                service_date: serviceDate,
                data: jsonbData,
                status: status
            });

            if (error) throw error;
            
            toast.success(`${template.name} submitted successfully`);
            if (onSuccess) onSuccess();
            else router.refresh();
        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error(error.message || "Failed to submit report");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6 bg-neutral-900 border border-neutral-800 p-8 rounded-xl">
            {template.description && (
                <div className="text-neutral-400 mb-6">{template.description}</div>
            )}
            
            <div className="space-y-6">
                {template.fields.map(field => {
                    return (
                        <div key={field.name} className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            
                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                                />
                            )}
                            
                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, Number(e.target.value))}
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                                />
                            )}
                            
                            {field.type === 'textarea' && (
                                <textarea
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    rows={4}
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                                />
                            )}
                            
                            {field.type === 'date' && (
                                <input
                                    type="date"
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                                />
                            )}
                            
                            {field.type === 'boolean' && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        required={field.required && !formData[field.name]}
                                        checked={!!formData[field.name]}
                                        onChange={(e) => handleChange(field.name, e.target.checked)}
                                        className="w-4 h-4 text-indigo-500 bg-neutral-800 border-neutral-700 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-neutral-400">Yes</span>
                                </div>
                            )}
                            
                            {field.type === 'select' && (
                                <select
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                                >
                                    <option value="" disabled>Select an option</option>
                                    {field.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}

                            {field.type === 'children_table' && (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto rounded-lg border border-neutral-700">
                                        <table className="w-full text-sm text-left text-neutral-400">
                                            <thead className="text-xs text-neutral-400 uppercase bg-neutral-800">
                                                <tr>
                                                    <th className="px-4 py-3">Child Name</th>
                                                    <th className="px-4 py-3 w-20 text-center">Present</th>
                                                    <th className="px-4 py-3 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(formData[field.name] || []).map((row: any, i: number) => (
                                                    <tr key={i} className="border-b border-neutral-700 bg-neutral-900">
                                                        <td className="px-4 py-2">
                                                            <input 
                                                                type="text" 
                                                                value={row.name || ''} 
                                                                onChange={(e) => handleChildrenTableChange(field.name, i, 'name', e.target.value)}
                                                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                                                                placeholder="Enter child name"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={!!row.present} 
                                                                onChange={(e) => handleChildrenTableChange(field.name, i, 'present', e.target.checked)}
                                                                className="w-4 h-4 text-indigo-500 bg-neutral-800 border-neutral-700 rounded focus:ring-indigo-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeChildrenTableRow(field.name, i)}
                                                                className="text-red-500 hover:text-red-400"
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!formData[field.name] || formData[field.name].length === 0) && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-4 text-center text-neutral-500">
                                                            No rows added yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => addChildrenTableRow(field.name)}
                                        className="text-sm px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700"
                                    >
                                        + Add Row
                                    </button>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
            
            <div className="pt-6 border-t border-neutral-800">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
            </div>
        </form>
    );
}
