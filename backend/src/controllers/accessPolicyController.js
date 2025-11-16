import { AccessPolicy } from '../models/index.js';

// Obtiene o crea la política única
const getOrCreatePolicy = async () => {
  let policy = await AccessPolicy.findOne();
  if (!policy) {
    policy = await AccessPolicy.create({ minAlumnoYear: 2020, extraAllowedYears: [] });
  }
  return policy;
};

export const getAccessPolicy = async (req, res) => {
  try {
    const policy = await getOrCreatePolicy();
    return res.json({
      success: true,
      data: {
        id: policy.id,
        minAlumnoYear: policy.minAlumnoYear,
        extraAllowedYears: policy.extraAllowedYears
      }
    });
  } catch (error) {
    console.error('Error fetching access policy:', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo la política' });
  }
};

export const updateAccessPolicy = async (req, res) => {
  try {
    const { minAlumnoYear, extraAllowedYears } = req.body || {};

    // Validar
    const parsedMin = parseInt(minAlumnoYear, 10);
    if (isNaN(parsedMin) || parsedMin < 1900 || parsedMin > 3000) {
      return res.status(400).json({ success: false, message: 'minAlumnoYear inválido' });
    }

    let extras = [];
    if (Array.isArray(extraAllowedYears)) {
      extras = extraAllowedYears.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    } else if (typeof extraAllowedYears === 'string') {
      extras = extraAllowedYears.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n));
    }

    const policy = await getOrCreatePolicy();
    policy.minAlumnoYear = parsedMin;
    policy.extraAllowedYears = extras;
    await policy.save();

    return res.json({
      success: true,
      message: 'Política actualizada',
      data: {
        id: policy.id,
        minAlumnoYear: policy.minAlumnoYear,
        extraAllowedYears: policy.extraAllowedYears
      }
    });
  } catch (error) {
    console.error('Error updating access policy:', error);
    return res.status(500).json({ success: false, message: 'Error actualizando la política' });
  }
};

export default { getAccessPolicy, updateAccessPolicy };