import { useState } from 'react';

export default function MedicalCalculators() {
  // BMI
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  const calcBMI = () => {
    const w = parseFloat(bmiWeight);
    const h = parseFloat(bmiHeight) / 100; // cm -> m
    if (w > 0 && h > 0) {
      setBmiResult((w / (h * h)).toFixed(1));
    }
  };

  // eGFR (CKD-EPI simplified)
  const [egfrAge, setEgfrAge] = useState('');
  const [egfrCreat, setEgfrCreat] = useState('');
  const [egfrGender, setEgfrGender] = useState('male');
  const [egfrResult, setEgfrResult] = useState(null);

  const calcEGFR = () => {
    const age = parseInt(egfrAge);
    const creat = parseFloat(egfrCreat);
    if (age > 0 && creat > 0) {
      let egfr = 141 * Math.pow(Math.min(creat / 0.9, 1), -0.411) * Math.pow(Math.max(creat / 0.9, 1), -1.209) * Math.pow(0.993, age);
      if (egfrGender === 'female') egfr *= 1.018;
      setEgfrResult(Math.round(egfr));
    }
  };

  return (
    <div>
      <div className="columns">
        {/* BMI Card */}
        <div className="column is-6">
          <div className="card">
            <div className="card-header"><p className="card-header-title">BMI Calculator</p></div>
            <div className="card-content">
              <div className="field">
                <label className="label">Weight (kg)</label>
                <input className="input" type="number" value={bmiWeight} onChange={e => setBmiWeight(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Height (cm)</label>
                <input className="input" type="number" value={bmiHeight} onChange={e => setBmiHeight(e.target.value)} />
              </div>
              <button className="button is-primary is-fullwidth" onClick={calcBMI}>Calculate</button>
              {bmiResult && <p className="mt-3 has-text-weight-bold">BMI: {bmiResult} kg/m²</p>}
            </div>
          </div>
        </div>

        {/* eGFR Card */}
        <div className="column is-6">
          <div className="card">
            <div className="card-header"><p className="card-header-title">eGFR (CKD-EPI)</p></div>
            <div className="card-content">
              <div className="field">
                <label className="label">Age (years)</label>
                <input className="input" type="number" value={egfrAge} onChange={e => setEgfrAge(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Creatinine (mg/dL)</label>
                <input className="input" type="number" step="0.1" value={egfrCreat} onChange={e => setEgfrCreat(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Gender</label>
                <div className="select is-fullwidth">
                  <select value={egfrGender} onChange={e => setEgfrGender(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <button className="button is-primary is-fullwidth" onClick={calcEGFR}>Calculate</button>
              {egfrResult && <p className="mt-3 has-text-weight-bold">eGFR: {egfrResult} mL/min/1.73m²</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
