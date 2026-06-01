import { useState } from 'react';
import MedicalCalculators from '../components/tools/MedicalCalculators';
import MarkdownCheatsheet from '../components/tools/MarkdownCheatsheet';
import QuickNotes from '../components/tools/QuickNotes';

export default function Tools() {
  const [activeTab, setActiveTab] = useState('calculators');

  const tabs = [
    { name: 'calculators', label: 'Calculators', icon: 'fa-calculator' },
    { name: 'markdown', label: 'Markdown Help', icon: 'fa-code' },
    { name: 'notes', label: 'Quick Notes', icon: 'fa-sticky-note' },
  ];

  return (
    <div>
      <h1 className="title">Tools & Utilities</h1>
      <div className="tabs is-boxed">
        <ul>
          {tabs.map(tab => (
            <li key={tab.name} className={activeTab === tab.name ? 'is-active' : ''}>
              <a onClick={() => setActiveTab(tab.name)}>
                <span className="icon is-small"><i className={`fas ${tab.icon}`}></i></span>
                <span>{tab.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        {activeTab === 'calculators' && <MedicalCalculators />}
        {activeTab === 'markdown' && <MarkdownCheatsheet />}
        {activeTab === 'notes' && <QuickNotes />}
      </div>
    </div>
  );
}
