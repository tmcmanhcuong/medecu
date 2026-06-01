import React, { useState } from 'react';
import { useNoteBlocks } from '../hooks/useNoteBlocks';
import NoteBlockList from './NoteBlockList';
import { Plus, Save, Download, Trash2 } from 'lucide-react';

/**
 * Demo component to test Add to Note with Citation functionality
 * Shows how blocks work with drag & drop
 */
export default function NoteBlocksDemo() {
    const [selectedText, setSelectedText] = useState('');
    const [pageNumber, setPageNumber] = useState(0);

    // Initialize with sample note
    const sampleNote = {
        id: 'demo-note',
        title: 'Demo Note with Citations',
        content: '', // Will be converted to blocks
        blocks: []
    };

    const {
        blocks,
        addBlock,
        reorderBlocks,
        removeBlock,
        toMarkdown,
        getBlocksData,
        noteContentRef
    } = useNoteBlocks(sampleNote);

    const handleAddBlock = () => {
        if (!selectedText.trim()) {
            alert('Please enter some text first');
            return;
        }

        addBlock(selectedText, pageNumber, 'quote');
        setSelectedText('');
    };

    const handleCitationClick = (position) => {
        alert(`Citation clicked: ${position}\n\nIn real app, this would scroll PDF to this position.`);
    };

    const handleExportMarkdown = () => {
        const markdown = toMarkdown();
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo-note.md';
        a.click();
    };

    const handleExportJSON = () => {
        const data = getBlocksData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo-note-blocks.json';
        a.click();
    };

    // Sample texts for quick testing
    const sampleTexts = [
        "This is a sample quote from page 1 of the PDF document.",
        "Machine learning models require large amounts of training data to achieve good performance.",
        "The LSTM model achieved an accuracy of 92.4% on the test set.",
        "Deep learning has revolutionized natural language processing in recent years."
    ];

    return (
        <div style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '20px', color: '#1f2937' }}>
                    Note Blocks Demo - Add to Note with Citation
                </h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Left: Input Panel */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#374151' }}>Simulate PDF Selection</h3>

                        {/* Quick Add Buttons */}
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                                Quick add sample text:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {sampleTexts.map((text, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSelectedText(text);
                                            setPageNumber(index);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            backgroundColor: '#eff6ff',
                                            color: '#1e40af',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Sample {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                                Selected Text:
                            </label>
                            <textarea
                                value={selectedText}
                                onChange={(e) => setSelectedText(e.target.value)}
                                placeholder="Enter text to add to note..."
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Page Number */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                                Page Number:
                            </label>
                            <input
                                type="number"
                                value={pageNumber}
                                onChange={(e) => setPageNumber(parseInt(e.target.value) || 0)}
                                min="0"
                                style={{
                                    width: '100px',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={handleAddBlock}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Plus className="w-5 h-5" />
                            Add to Note
                        </button>

                        {/* Stats */}
                        <div style={{
                            marginTop: '20px',
                            padding: '12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px'
                        }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                                <strong>Total Blocks:</strong> {blocks.length}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                                <strong>With Citations:</strong> {blocks.filter(b => b.citation).length}
                            </p>
                        </div>

                        {/* Export Buttons */}
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleExportMarkdown}
                                disabled={blocks.length === 0}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: blocks.length === 0 ? '#e5e7eb' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Download className="w-4 h-4" />
                                Markdown
                            </button>
                            <button
                                onClick={handleExportJSON}
                                disabled={blocks.length === 0}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: blocks.length === 0 ? '#e5e7eb' : '#8b5cf6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Download className="w-4 h-4" />
                                JSON
                            </button>
                        </div>
                    </div>

                    {/* Right: Note Preview */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        maxHeight: '600px',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ margin: 0, color: '#374151' }}>Note Preview</h3>
                            {blocks.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (confirm('Clear all blocks?')) {
                                            blocks.forEach(b => removeBlock(b.id));
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div ref={noteContentRef}>
                            <NoteBlockList
                                blocks={blocks}
                                onBlocksReorder={reorderBlocks}
                                onCitationClick={handleCitationClick}
                            />
                        </div>

                        {blocks.length > 0 && (
                            <div style={{
                                marginTop: '20px',
                                padding: '12px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#92400e'
                            }}>
                                <strong>💡 Tip:</strong> Drag blocks to reorder them. Click citations to view source in PDF.
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div style={{
                    marginTop: '20px',
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginTop: 0, color: '#374151' }}>How to Use</h3>
                    <ol style={{ color: '#6b7280', lineHeight: '1.8' }}>
                        <li>Click a "Sample" button or type your own text</li>
                        <li>Set the page number (simulates PDF page)</li>
                        <li>Click "Add to Note" to create a block with citation</li>
                        <li>Drag blocks to reorder them (grab the left edge)</li>
                        <li>Click citations to see the source position</li>
                        <li>Export to Markdown or JSON to see the data structure</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
