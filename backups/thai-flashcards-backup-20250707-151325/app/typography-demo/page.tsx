import React from 'react';

export default function TypographyDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-16">
      <h1 className="text-4xl font-bold mb-8">Typography Comparison Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Roboto for all text */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Roboto (All Text) <span className="text-base font-normal">(Trello style)</span></h2>
          <div style={{ fontFamily: 'Roboto, sans-serif' }} className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1 - Roboto</h1>
            <h2 className="text-3xl font-semibold">Heading 2 - Roboto</h2>
            <h3 className="text-2xl font-medium">Heading 3 - Roboto</h3>
            <p className="text-base">This is body text using <b>Roboto</b>. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur.</p>
            <button className="neumorphic-button">Button (Roboto)</button>
          </div>
        </section>
        {/* Montserrat Headings, Roboto Body */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Montserrat (Headings) + Roboto (Body)</h2>
          <div className="space-y-4">
            <h1 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-4xl font-bold">Heading 1 - Montserrat</h1>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-3xl font-semibold">Heading 2 - Montserrat</h2>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-2xl font-medium">Heading 3 - Montserrat</h3>
            <p style={{ fontFamily: 'Roboto, sans-serif' }} className="text-base">This is body text using <b>Roboto</b>. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur.</p>
            <button style={{ fontFamily: 'Roboto, sans-serif' }} className="neumorphic-button">Button (Roboto)</button>
          </div>
        </section>
      </div>
    </div>
  );
} 