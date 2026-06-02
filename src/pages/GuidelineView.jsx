import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import MDEditor from '@uiw/react-md-editor';
import CDSSFlowViewer from '../components/ui/CDSSFlowViewer';
import { fetchRules } from '../services/cdssService';

export default function GuidelineView() {
  const { id } = useParams();
  const [guideline, setGuideline] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('guidelines')
        .select(`
          *,
          category:categories(name),
          sections:guideline_sections(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        setGuideline(null);
      } else {
        data.sections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setGuideline(data);
        try {
          const cdssRules = await fetchRules(data.id);
          setRules(cdssRules);
        } catch (err) {
          console.error('Failed to load CDSS rules:', err);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <progress className="progress is-primary" max="100">Loading...</progress>;
  if (!guideline) return <div className="notification is-danger">Guideline not found.</div>;

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/guidelines" className="button is-light mb-4">
        <span className="icon"><i className="fas fa-arrow-left"></i></span>
        <span>Back to Guidelines</span>
      </Link>

      <h1 className="title is-2">{guideline.title}</h1>
      <div className="tags mb-4">
        {guideline.category && (
          <span className="tag is-info is-medium">{guideline.category.name}</span>
        )}
        <span className={`tag is-medium ${guideline.status === 'published' ? 'is-success' : 'is-warning'}`}>
          {guideline.status}
        </span>
      </div>

      <div className="content">
        {guideline.sections.map((section, idx) => {
          const content = section.content || '';
          // Check if content starts with a Markdown heading (e.g., ##, ###)
          const startsWithHeading = /^#{1,6}\s/.test(content);
          return (
            <div key={idx} className="mb-6">
              {section.title && !startsWithHeading && (
                <h3 className="title is-4">{section.title}</h3>
              )}
              <MDEditor.Markdown source={content} />
            </div>
          );
        })}
      </div>

      {rules.length > 0 && (
        <div className="mt-6">
          <h3 className="title is-4">Clinical Decision Support Rules</h3>
          <CDSSFlowViewer rules={rules} />
        </div>
      )}

      <Link to="/guidelines" className="button is-light mt-5">
        <span className="icon"><i className="fas fa-arrow-left"></i></span>
        <span>Back to Guidelines</span>
      </Link>
    </div>
  );
}
