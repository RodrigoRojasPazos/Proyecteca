import { AccessException } from '../models/index.js';

export const listExceptions = async (req, res) => {
  try {
    const items = await AccessException.findAll({ order: [['email','ASC']] });
    res.json({ success: true, data: items.map(i => ({ id: i.id, email: i.email, note: i.note })) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error listando excepciones' });
  }
};

export const addException = async (req, res) => {
  try {
    const { email, note } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'Email requerido' });
    const normalized = String(email).toLowerCase();
    const existing = await AccessException.findOne({ where: { email: normalized } });
    if (existing) return res.status(409).json({ success: false, message: 'El correo ya existe en excepciones' });
    const item = await AccessException.create({ email: normalized, note });
    res.json({ success: true, data: { id: item.id, email: item.email, note: item.note } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error agregando excepción' });
  }
};

export const bulkAddExceptions = async (req, res) => {
  try {
    const { emails } = req.body || {};
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Lista de emails requerida' });
    }
    const results = [];
    for (const raw of emails) {
      const email = String(raw).toLowerCase().trim();
      if (!email) continue;
      const exists = await AccessException.findOne({ where: { email } });
      if (exists) {
        results.push({ email, status: 'exists' });
        continue;
      }
      try {
        const created = await AccessException.create({ email });
        results.push({ email: created.email, status: 'created' });
      } catch (err) {
        results.push({ email, status: 'error', error: err.message });
      }
    }
    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error en carga masiva' });
  }
};

export const removeException = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AccessException.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Excepción no encontrada' });
    await item.destroy();
    res.json({ success: true, message: 'Excepción eliminada' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error eliminando excepción' });
  }
};

export default { listExceptions, addException, bulkAddExceptions, removeException };