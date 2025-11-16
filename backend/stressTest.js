import http from 'http';

const BASE_URL = 'http://localhost:5000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTkxLCJlbWFpbCI6IjIwMjMwMDE4MkB1cHFyb28uZWR1Lm14Iiwicm9sZSI6ImRpcmVjdG9yIiwiaWF0IjoxNzYzMzEwOTA1LCJleHAiOjE3NjU5MDI5MDV9.wCtp6Yq6JrgHJyde0ucJHsQtlyZR-mfjSQLGDUCRMVQ';
const TOTAL_REQUESTS = 30;
const CONCURRENT = 5;

function sendRequest({ method, path, body }) {
  return new Promise((resolve) => {
    const options = {
      method,
      hostname: 'localhost',
      port: 5000,
      path,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', (err) => {
      resolve({ status: 'error', data: err.message });
    });
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function stressTest() {
  // 1. Crear usuarios únicos
  let createdUserIds = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const userData = {
      nombre: `TestUser${i}_${Date.now()}`,
      correo: `testuser${i}_${Date.now()}@example.com`,
      rol: 'alumno',
      matricula: `MAT${i}${Date.now()}`
    };
    const res = await sendRequest({ method: 'POST', path: '/api/users', body: userData });
    try {
      const json = JSON.parse(res.data);
      if (res.status === 201 && json.success && json.data && json.data.id_usuario) {
        createdUserIds.push(json.data.id_usuario);
        console.log(`Usuario creado: ${json.data.id_usuario}`);
      } else {
        console.log(`Error creando usuario:`, res.data);
      }
    } catch (e) {
      console.log(`Error parseando respuesta de creación:`, res.data);
    }
  }

  // 2. Probar GET, PUT y DELETE sobre los usuarios creados
  for (const userId of createdUserIds) {
    const getRes = await sendRequest({ method: 'GET', path: `/api/users/${userId}` });
    console.log(`GET /api/users/${userId} - Status: ${getRes.status}`);
    const putRes = await sendRequest({ method: 'PUT', path: `/api/users/${userId}`, body: { nombre: 'UpdatedName', rol: 'profesor' } });
    console.log(`PUT /api/users/${userId} - Status: ${putRes.status}`);
    const delRes = await sendRequest({ method: 'DELETE', path: `/api/users/${userId}` });
    console.log(`DELETE /api/users/${userId} - Status: ${delRes.status}`);
  }

  // 3. Crear proyectos únicos
  let createdProjectIds = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const projectData = {
      titulo: `TestProject${i}_${Date.now()}`,
      descripcion: 'Proyecto de stress test',
    };
    const res = await sendRequest({ method: 'POST', path: '/api/projects', body: projectData });
    try {
      const json = JSON.parse(res.data);
      if (res.status === 201 && json.success && json.data && json.data.id_proyecto) {
        createdProjectIds.push(json.data.id_proyecto);
        console.log(`Proyecto creado: ${json.data.id_proyecto}`);
      } else {
        console.log(`Error creando proyecto:`, res.data);
      }
    } catch (e) {
      console.log(`Error parseando respuesta de creación proyecto:`, res.data);
    }
  }

  // 4. Probar GET, PUT y DELETE sobre los proyectos creados
  for (const projectId of createdProjectIds) {
    const getRes = await sendRequest({ method: 'GET', path: `/api/projects/${projectId}` });
    console.log(`GET /api/projects/${projectId} - Status: ${getRes.status}`);
    const putRes = await sendRequest({ method: 'PUT', path: `/api/projects/${projectId}`, body: { titulo: 'UpdatedProject', descripcion: 'Actualizado' } });
    console.log(`PUT /api/projects/${projectId} - Status: ${putRes.status}`);
    const delRes = await sendRequest({ method: 'DELETE', path: `/api/projects/${projectId}` });
    console.log(`DELETE /api/projects/${projectId} - Status: ${delRes.status}`);
  }

// 5. Crear profesores únicos
let createdProfessorIds = [];
for (let i = 0; i < TOTAL_REQUESTS; i++) {
  const profData = {
    nombre: `ProfTest${i}_${Date.now()}`,
    email: `prof${i}_${Date.now()}@example.com`,
    matricula: `MATPROF${i}${Date.now()}`
  };
  const res = await sendRequest({ method: 'POST', path: '/api/professors', body: profData });
  try {
    const json = JSON.parse(res.data);
    if (res.status === 201 && json.success && json.data && (json.data.id || json.data.id_profesor)) {
      const profId = json.data.id_profesor || json.data.id;
      createdProfessorIds.push(profId);
      console.log(`Profesor creado: ${profId}`);
    } else {
      console.log(`Error creando profesor:`, res.data);
    }
  } catch (e) {
    console.log(`Error parseando respuesta de creación profesor:`, res.data);
  }
}

// 6. Probar PATCH sobre los profesores creados (solo toggle-status, sin PUT)
for (const profId of createdProfessorIds) {
  // PATCH (toggle status)
  const patchRes = await sendRequest({ method: 'PATCH', path: `/api/professors/${profId}/toggle-status` });
  console.log(`PATCH /api/professors/${profId}/toggle-status - Status: ${patchRes.status}`);
}
}
stressTest();