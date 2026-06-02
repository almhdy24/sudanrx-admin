import { supabase } from '../supabaseClient';

export async function fetchRules(guidelineId) {
  const { data, error } = await supabase
    .from('cdss_rules')
    .select('*')
    .eq('guideline_id', guidelineId)
    .order('priority');
  if (error) throw error;
  return data;
}

export async function createRule(rule) {
  const { data, error } = await supabase
    .from('cdss_rules')
    .insert([rule])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRule(id, updates) {
  const { error } = await supabase
    .from('cdss_rules')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRule(id) {
  const { error } = await supabase
    .from('cdss_rules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Evaluation engine
const OPERATORS = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  'contains': (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
};

export function evaluateRules(rules, patientData) {
  return rules
    .filter(r => r.status === 'active')
    .map(rule => {
      const { parameter, operator, value } = rule.condition;
      const patientValue = patientData[parameter];
      if (patientValue === undefined) return null;
      const fn = OPERATORS[operator];
      if (!fn) return null;
      const a = isNaN(patientValue) ? patientValue : Number(patientValue);
      const b = isNaN(value) ? value : Number(value);
      return fn(a, b) ? { rule, action: rule.action } : null;
    })
    .filter(Boolean);
}
