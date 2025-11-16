import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Calendar, User, GraduationCap, Plus, Minus, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../services/api';
import api from '../services/api';

interface Professor {
  id: number;
  nombre: string;
  email: string;
  matricula: string;
}

interface UploadProjectProps {
  isOpen: boolean;
  onClose: () => void;
  programa?: string;
  isEditMode?: boolean;
  projectToEdit?: any;
}

const UploadProject: React.FC<UploadProjectProps> = ({ isOpen, onClose, programa, isEditMode = false, projectToEdit }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Función para extraer matrícula del email institucional
  const extraerMatriculaDeEmail = (email: string): string => {
    // Buscar números al inicio del email antes del @
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : '';
  };



  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    autor: '',
    correoInstitucional: '',
    matricula: '',
    integrantes: [] as { nombre: string; correo: string; matricula: string }[],
    professor_id: '',
    programa: programa || '',
    tipoEstancia: '',
    fechaDefensa: '',
    githubLink: '',
    baseDatos: '',
    tecnologias: [] as string[],
    archivo: null as File | null
  });

  const [isDragging, setIsDragging] = useState(false);
  const [searchTech, setSearchTech] = useState('');
  const [searchDB, setSearchDB] = useState('');
  const [showNoDatabaseModal, setShowNoDatabaseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Función para cerrar con animación
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      // Reset del formulario y estado
      setFormData({
        titulo: '',
        descripcion: '',
        autor: '',
        correoInstitucional: '',
        matricula: '',
        integrantes: [],
        professor_id: '',
        programa: programa || '',
        tipoEstancia: '',
        fechaDefensa: '',
        githubLink: '',
        baseDatos: '',
        tecnologias: [],
        archivo: null
      });
      setShowSuccessModal(false);
    }, 300);
  };

  // Cargar profesores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadProfessors();
      // Pequeño delay para mostrar la animación
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Pre-poblar datos cuando estamos en modo edición
  useEffect(() => {
    if (isEditMode && projectToEdit) {
      // Extraer datos del autor principal y integrantes desde el array de alumnos
      const alumnos = projectToEdit.alumnos || [];
      const autorPrincipal = alumnos[0] || {};
      const integrantesArray = alumnos.slice(1).map((alumno: any) => ({
        nombre: alumno.nombre || '',
        correo: alumno.email || alumno.correo || '',
        matricula: alumno.matricula || ''
      }));

      setFormData({
        titulo: projectToEdit.titulo || '',
        descripcion: projectToEdit.descripcion || '',
        autor: projectToEdit.autor || autorPrincipal.nombre || '',
        correoInstitucional: projectToEdit.correoInstitucional || autorPrincipal.email || autorPrincipal.correo || '',
        matricula: projectToEdit.matricula || autorPrincipal.matricula || '',
        integrantes: integrantesArray,
        professor_id: projectToEdit.profesor_id?.toString() || projectToEdit.professor_id?.toString() || '',
        programa: projectToEdit.programa || '',
        tipoEstancia: projectToEdit.tipoEstancia || projectToEdit.asignatura || projectToEdit.tipo || '',
        fechaDefensa: projectToEdit.fechaDefensa || '',
        githubLink: projectToEdit.githubLink || projectToEdit.url_repositorio || '',
        baseDatos: projectToEdit.baseDatos || '',
        tecnologias: projectToEdit.tecnologias || [],
        archivo: null // El archivo no se puede pre-poblar, debe subir uno nuevo si quiere cambiar
      });
    }
  }, [isEditMode, projectToEdit]);

  const loadProfessors = async () => {
    try {
      setLoadingProfessors(true);
      const response = await api.get('/professors/active');
      
      if (response.data.success) {
        setProfessors(response.data.data);
      }
    } catch (error) {
      console.error('Error loading professors:', error);
    } finally {
      setLoadingProfessors(false);
    }
  };

  const programas = [
    'INGENIERÍA EN SOFTWARE',
    'INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN E INNOVACIÓN DIGITAL'
  ];

  const lenguajesDisponibles = [
    // Lenguajes de programación principales
    'JavaScript', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'TypeScript',
    'Swift', 'Kotlin', 'Dart', 'Go', 'Rust', 'Ruby', 'MATLAB', 'R', 'Scala',
    'Perl', 'Haskell', 'Erlang', 'Elixir', 'Clojure', 'F#', 'VB.NET', 'Assembly',
    'Objective-C', 'Julia', 'Lua', 'Groovy', 'Pascal', 'Fortran', 'COBOL',
    'Ada', 'Scheme', 'Lisp', 'Prolog', 'Tcl', 'VHDL', 'Verilog', 'OCaml',
    'ML', 'Standard ML', 'Caml', 'Racket', 'CoffeeScript', 'LiveScript',
    'PureScript', 'Reason', 'ReScript', 'Nim', 'Crystal', 'D', 'Zig',
    'V', 'Odin', 'Carbon', 'Red', 'Io', 'Forth', 'Factor', 'APL', 'J',
    'K', 'Q', 'Smalltalk', 'Eiffel', 'Modula-2', 'Oberon', 'Algol',
    
    // Frameworks Frontend Web
    'React', 'Angular', 'Vue.js', 'Svelte', 'SvelteKit', 'Next.js', 'Nuxt.js', 
    'Gatsby', 'Remix', 'Astro', 'SolidJS', 'Qwik', 'Alpine.js', 'Lit',
    'Ember.js', 'Backbone.js', 'Knockout.js', 'Mithril', 'Preact',
    'Inferno', 'Hyperapp', 'Cycle.js', 'Riot.js', 'Stimulus', 'Turbo',
    'Hotwire', 'HTMX', 'Marko', 'Stencil', 'Aurelia', 'Polymer',
    'LitElement', 'Fast', 'Dojo', 'Mootools', 'Prototype', 'YUI',
    'Ext JS', 'Sencha Touch', 'GWT', 'Vaadin', 'PrimeFaces', 'JSF',
    
    // UI Libraries y CSS Frameworks
    'jQuery', 'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design',
    'Chakra UI', 'Semantic UI', 'Bulma', 'Foundation', 'UIKit',
    'Materialize', 'Pure CSS', 'Tachyons', 'Styled Components', 'Emotion',
    'Stitches', 'Vanilla Extract', 'Linaria', 'JSS', 'Aphrodite',
    'Glamorous', 'Fela', 'Rebass', 'Theme UI', 'Grommet', 'Evergreen',
    'Blueprint', 'React Suite', 'Next UI', 'Mantine', 'Arco Design',
    'Semi Design', 'Naive UI', 'Quasar', 'Vuetify', 'Element Plus',
    'PrimeVue', 'Vant', 'NutUI', 'TDesign', 'Ionic Components',
    'Carbon Design System', 'Fluent UI', 'Lightning Design System',
    'Patternfly', 'Atlassian Design System', 'Polaris', 'Primer',
    
    // Frameworks Backend
    'Node.js', 'Express.js', 'Spring Boot', 'Spring Framework', 'Django', 
    'Flask', 'FastAPI', 'Laravel', 'CodeIgniter', 'CakePHP', 'Zend/Laminas',
    'ASP.NET', 'ASP.NET Core', 'Ruby on Rails', 'Sinatra', 'Symfony',
    'NestJS', 'Koa.js', 'Hapi.js', 'Fastify', 'Sails.js', 'Meteor',
    'Phoenix', 'Gin', 'Echo', 'Fiber', 'Chi', 'Gorilla', 'Beego',
    'Actix', 'Rocket', 'Warp', 'Axum', 'Tokio', 'Tide', 'Poem',
    'Yew', 'Leptos', 'Dioxus', 'Tauri', 'Egui', 'Iced', 'Druid',
    'Grails', 'Play Framework', 'Ktor', 'Micronaut', 'Quarkus',
    'Helidon', 'Vert.x', 'Dropwizard', 'Javalin', 'Spark Java',
    'Ratpack', 'Pippo', 'Ninja', 'Jodd', 'Blade', 'JFinal',
    'Struts', 'Wicket', 'Tapestry', 'MyBatis', 'Hibernate',
    'Hanami', 'Roda', 'Camping', 'Padrino', 'Grape', 'Trailblazer',
    'Falcon', 'Quart', 'Sanic', 'Tornado', 'CherryPy', 'Bottle',
    'Web2py', 'TurboGears', 'Pyramid', 'Pylons', 'Zope', 'Plone',
    'Twisted', 'Celery', 'Gunicorn', 'uWSGI', 'Waitress', 'Hypercorn',
    'Uvicorn', 'Daphne', 'Channels', 'Starlette', 'Responder',
    
    // Frameworks Mobile
    'Flutter', 'React Native', 'Ionic', 'Xamarin', 'Cordova/PhoneGap',
    'NativeScript', 'Expo', 'Capacitor', 'Electron (Mobile)', 
    'Titanium',
    'Framework7', 'OnsenUI', 'Nativescript-Vue',
    'Weex', 'Taro', 'Uni-app', 'Chameleon', 'mpvue', 'WePY',
    'Remax', 'Hippy', 'Lynx', 'Rax', 'omi', 'San', 'RegularJS',
    'MVVM', 'Angular Mobile', 'Vue Native', 'Svelte Native',
    'Kotlin Multiplatform', 'Compose Multiplatform', 'KMM',
    'J2ME', 'BlackBerry', 'Windows Phone', 'Tizen', 'webOS',
    
    // Frameworks Desktop
    'Electron', 'GTK', 'WPF', 'WinUI', 'JavaFX',
    'Swing', 'AWT', 'SWT', 'Tkinter', 'PyQt', 'PySide', 'wxPython',
    'Dear ImGui', 'FLTK', 'Fox Toolkit', 'Ultimate++',
    'CEGUI', 'JUCE', 'wxWidgets', 'MFC', 'ATL', 'Win32 API',
    'Cocoa', 'AppKit', 'UIKit', 'Carbon', 'Xlib', 'Motif',
    'Athena', 'Tk', 'Tcl/Tk', 'FXML', 'Scene Builder', 'NetBeans Platform',
    'Eclipse RCP', 'IntelliJ Platform', 'Visual Studio Shell',
    'WinForms', 'UWP', 'Avalonia', 'Uno Platform',
    'OpenSilver', 'Blazor Hybrid', 'Photino', 'WebView2',
    'CEF', 'Chromium Embedded', 'Neutralino', 'NodeGUI',
    'Proton Native', 'Revery', 'Azul', 'Eto.Forms',
    
    // Game Development
    'Unity', 'Unreal Engine', 'Godot', 'GameMaker Studio', 'Construct',
    'Defold', 'Solar2D', 'LÖVE', 'Pygame', 'Panda3D', 'Arcade',
    'Phaser', 'Three.js', 'Babylon.js', 'A-Frame', 'PlayCanvas',
    'Cocos2d', 'Cocos2d-x', 'LibGDX', 'MonoGame', 'FNA', 'XNA',
    'SFML', 'SDL', 'Allegro', 'Irrlicht', 'OGRE', 'OpenSceneGraph',
    'Blender Game Engine', 'CryEngine', 'Lumberyard',
    'Source Engine', 'IdTech', 'Frostbite', 'REDengine', 'Creation Engine',
    'GameGuru', 'RPG Maker', 'Ren\'Py', 'Twine', 'Ink', 'Yarn',
    'Bitsy', 'PuzzleScript', 'Flickgame', 'Stencyl', 'Scratch',
    'AppGameKit', 'BlitzMax', 'Monkey X', 'Haxe', 'OpenFL',
    'HaxeFlixel', 'Kha', 'Heaps', 'Armory3D', 'ct.js', 'GDevelop',
    'Pixijs', 'Konva.js', 'Fabric.js', 'Paper.js', 'p5.js',
    'Processing', 'openFrameworks', 'Cinder', 'nannou', 'Bevy',
    'Amethyst', 'ggez', 'Macroquad', 'Raylib', 'Allegro.cc',
    
    // Data Science & ML
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas',
    'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Bokeh',
    'OpenCV', 'NLTK', 'spaCy', 'Hugging Face', 'Transformers',
    'MLflow', 'Weights & Biases', 'Neptune', 'Comet', 'TensorBoard',
    'Apache Spark', 'Dask', 'Ray', 'Modin', 'Vaex', 'Polars',
    'CuPy', 'JAX', 'Flax', 'Haiku', 'Trax', 'Optax', 'Chex',
    'XGBoost', 'LightGBM', 'CatBoost', 'Vowpal Wabbit', 'H2O.ai',
    'Auto-sklearn', 'AutoML', 'TPOT', 'PyCaret', 'Lazy Predict',
    'Streamlit', 'Gradio', 'Dash', 'Panel', 'Voila', 'Jupyter',
    'JupyterLab', 'Google Colab', 'Kaggle Kernels', 'Deepnote',
    'Apache Airflow', 'Prefect', 'Kedro', 'Metaflow', 'ZenML',
    'Kubeflow', 'MLRun', 'Seldon', 'BentoML', 'Cortex', 'Algorithmia',
    'FastAI', 'Lightning', 'Catalyst', 'Ignite', 'Higher', 'Learn2Learn',
    'Avalanche', 'River', 'Scikit-multiflow', 'Weka', 'Orange',
    'Knime', 'RapidMiner', 'Dataiku', 'Alteryx', 'Talend',
    'Apache NiFi', 'Pentaho', 'Informatica', 'SSIS', 'Fivetran',
    'Stitch', 'Airbyte', 'Singer', 'Great Expectations', 'Pandera',
    'Cerberus', 'Marshmallow', 'Pydantic', 'Schema', 'Voluptuous',
    
    // Testing Frameworks
    'Jest', 'Cypress', 'Selenium', 'Playwright', 'Puppeteer', 'WebDriver',
    'JUnit', 'TestNG', 'Mockito', 'PowerMock', 'EasyMock', 'WireMock',
    'PyTest', 'unittest', 'nose2', 'Robot Framework', 'Behave',
    'RSpec', 'Minitest', 'Cucumber', 'FactoryBot', 'VCR', 'WebMock',
    'Mocha', 'Jasmine', 'Karma', 'Protractor', 'Nightwatch', 'CodeceptJS',
    'Vitest', 'Testing Library', 'Enzyme', 'Sinon', 'Chai', 'Should.js',
    'QUnit', 'Tape', 'Ava', 'Lab', 'Code', 'Tap', 'Node-tap',
    'Supertest', 'Frisby', 'Dredd', 'Postman', 'Newman', 'Insomnia',
    'REST Assured', 'Karate', 'Gatling', 'JMeter', 'Locust', 'Artillery',
    'k6', 'LoadRunner', 'BlazeMeter', 'Loader.io', 'WebPageTest',
    'Lighthouse', 'PageSpeed Insights', 'GTmetrix', 'Pingdom', 'Uptime Robot',
    'TestCafe', 'Detox', 'Appium', 'Espresso', 'XCTest', 'Earl Grey',
    'Quick', 'Nimble', 'OCMock', 'Specta', 'Expecta', 'KIF',
    'Calabash', 'Robotium', 'Robolectric', 'Mockk', 'Spek', 'Kotest',
    'Spock', 'Geb', 'Testcontainers', 'Pact', 'Contract Testing',
    
    // Tecnologías Web
    'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'SCSS', 'LESS', 'Stylus', 'PostCSS',
    'Autoprefixer', 'PurgeCSS', 'cssnano', 'Critical', 'UnCSS', 'clean-css',
    'Webpack', 'Vite', 'Parcel', 'Rollup', 'esbuild', 'Turbopack', 'Rome',
    'Babel', 'TypeScript Compiler', 'SWC', 'Sucrase', 'Bublé',
    'Browserify', 'RequireJS', 'SystemJS', 'AMD', 'UMD', 'CommonJS',
    'ES Modules', 'Dynamic Imports', 'Web Workers', 'Service Workers',
    'WebAssembly', 'asm.js', 'Emscripten', 'WASI', 'AssemblyScript',
    'Blazor WebAssembly', 'Yew', 'Percy', 'Seed', 'Smithy',
    'Web Components', 'Custom Elements', 'Shadow DOM', 'HTML Templates',
    'Angular Elements',
    'Vue Custom Elements', 'Svelte Custom Elements', 'Haunted',
    'Hybrids', 'SkateJS', 'Slim.js', 'DNA', 'Tonic', 'Uce',
    
    // Cloud Platforms
    'AWS', 'Amazon Web Services', 'EC2', 'S3', 'Lambda', 'RDS', 'DynamoDB',
    'CloudFront', 'Route 53', 'API Gateway', 'Cognito', 'SES', 'SNS', 'SQS',
    'Azure', 'Microsoft Azure', 'Azure Functions', 'Cosmos DB', 'Azure SQL',
    'Azure Storage', 'Azure CDN', 'Azure AD', 'Logic Apps', 'Service Bus',
    'Google Cloud', 'GCP', 'Compute Engine', 'Cloud Storage', 'BigQuery',
    'Cloud Functions', 'Firestore', 'Cloud SQL', 'Pub/Sub', 'Cloud Run',
    'Heroku', 'Vercel', 'Netlify', 'DigitalOcean', 'Linode', 'Vultr',
    'Cloudflare', 'Cloudflare Workers', 'Cloudflare Pages', 'Railway',
    'PlanetScale', 'Neon', 'Fly.io', 'Render', 'Cyclic',
    'Deta', 'Glitch', 'StackBlitz', 'Gitpod', 'Codespaces',
    'Replit', 'Cloud9', 'Koding', 'Codenvy', 'Eclipse Che', 'Theia',
    'Firebase', 'Firebase Hosting', 'Firebase Functions', 'Firebase Auth',
    'Firebase Realtime Database', 'Firebase Storage', 'Firebase Analytics',
    'Amplify', 'AppSync', 'Pinpoint', 'Device Farm',
    'Alibaba Cloud', 'Tencent Cloud', 'Baidu Cloud', 'Oracle Cloud',
    'IBM Cloud', 'Red Hat OpenShift', 'VMware', 'Rackspace', 'OVH',
    
    // DevOps & Containerization
    'Docker', 'Kubernetes', 'Docker Compose', 'Docker Swarm', 'Podman',
    'LXC', 'LXD', 'rkt', 'containerd', 'CRI-O', 'Buildah', 'Skopeo',
    'Vagrant', 'VirtualBox', 'Hyper-V', 'KVM', 'Xen',
    'Ansible', 'Terraform', 'Pulumi', 'CloudFormation', 'ARM Templates',
    'Chef', 'Puppet', 'SaltStack', 'Fabric', 'Capistrano', 'Deployer',
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
    'Azure DevOps', 'TeamCity', 'Bamboo', 'BuildKite', 'Drone',
    'Concourse', 'Tekton', 'Argo CD', 'Flux', 'Spinnaker', 'Harness',
    'Helm', 'Kustomize', 'Skaffold', 'Draft', 'Garden', 'Tilt',
    'Minikube', 'kind', 'k3s', 'microk8s', 'Rancher',
    'Istio', 'Linkerd', 'Consul Connect', 'Envoy', 'NGINX', 'Traefik',
    'HAProxy', 'Kong', 'Ambassador', 'Gloo', 'Contour', 'Ingress-NGINX',
    'Jaeger', 'Zipkin', 'OpenTelemetry',
    'ELK Stack', 'Logstash', 'Kibana',
    'Fluent Bit', 'Loki', 'Tempo', 'Cortex', 'Thanos',
    
    // API Technologies
    'GraphQL', 'REST API', 'tRPC', 'Apollo GraphQL', 'GraphQL Yoga',
    'Prisma', 'Hasura', 'PostgREST', 'Postgraphile', 'Directus',
    'Appwrite', 'Fauna', 'AWS AppSync',
    'Stepzen', 'WunderGraph', 'Grafbase', 'Hygraph',
    'OpenAPI', 'Swagger', 'Thunder Client',
    'Paw', 'Advanced REST Client', 'HTTPie', 'curl', 'wget',
    'Axios', 'Fetch API', 'XMLHttpRequest', 'SuperAgent', 'Got',
    'Request', 'Node-fetch', 'Isomorphic-fetch', 'Cross-fetch',
    'SWR', 'React Query', 'Apollo Client',
    'Vue Apollo', 'Svelte Apollo', 'urql', 'graphql-request',
    
    // Real-time & Communication
    'WebRTC', 'Server-Sent Events', 'EventSource',
    'Pusher', 'Ably', 'PubNub', 'ActionCable', 'Phoenix Channels',
    'Laravel Echo', 'Soketi', 'Laravel WebSockets', 'Beyond Code WebSockets',
    'Centrifugo', 'Mercure', 'Fanout', 'Stream', 'GetStream',
    'Firestore Real-time', 'Supabase Realtime',
    'IBM Watson IoT',
    'MQTT', 'CoAP', 'AMQP', 'STOMP', 'XMPP', 'Matrix', 'IRC',
    'Slack API', 'Discord API', 'Telegram Bot API', 'WhatsApp Business API',
    'Twilio', 'SendGrid', 'Mailgun', 'Postmark',
    'Nodemailer', 'EmailJS', 'React Email', 'MJML', 'Foundation for Emails',
    
    // CMS & Headless CMS
    'WordPress', 'Drupal', 'Joomla', 'Typo3', 'Concrete5', 'ProcessWire',
    'Craft CMS', 'ExpressionEngine', 'Kirby', 'Grav', 'October CMS',
    'Strapi', 'Sanity', 'Contentful', 'Ghost', 'KeystoneJS',
    'Payload CMS', 'Forestry', 'NetlifyCMS', 'TinaCMS', 'Decap CMS',
    'Builder.io', 'DatoCMS', 'Prismic', 'Storyblok', 'Butter CMS',
    'Agility CMS', 'Kentico Kontent', 'Umbraco Heartcore', 'Contentstack',
    'CosmicJS', 'GraphCMS', 'Takeshape',
    'Cockpit CMS', 'Apostrophe', 'ApostropheCMS', 'Wagtail', 'Django CMS',
    'Mezzanine', 'Lektor', 'Nikola',
    
    // E-commerce
    'Shopify', 'WooCommerce', 'Magento', 'PrestaShop', 'OpenCart',
    'osCommerce', 'Zen Cart', 'X-Cart', 'CS-Cart', 'Drupal Commerce',
    'Spree Commerce', 'Solidus', 'Saleor', 'Sylius', 'Reaction Commerce',
    'Medusa', 'Next.js Commerce', 'Commerce.js', 'Snipcart', 'Foxy.io',
    'Ecwid', 'BigCommerce', 'Volusion', 'Squarespace Commerce', 'Wix Stores',
    'Square Online', 'Gumroad', 'Selz', 'Tictail', 'Big Cartel',
    'Etsy Pattern', 'Facebook Shop', 'Instagram Shopping', 'Pinterest Shopping',
    'Amazon Marketplace', 'eBay', 'Mercado Libre', 'Alibaba', 'AliExpress',
    'Braintree', 'Adyen', 'Klarna',
    'Afterpay', 'Apple Pay', 'Google Pay', 'Amazon Pay', 'Shop Pay',
    
    // Blockchain & Web3
    'Ethereum', 'Bitcoin', 'Binance Smart Chain', 'Polygon', 'Avalanche',
    'Solana', 'Cardano', 'Polkadot', 'Cosmos', 'Terra',
    'Solidity', 'Vyper', 'Rust (Solana)', 'Move', 'Clarity', 'Plutus',
    'Web3.js', 'Ethers.js', 'Web3.py', 'Brownie', 'Ape', 'Foundry',
    'Hardhat', 'Truffle', 'Ganache', 'Remix IDE', 'OpenZeppelin',
    'IPFS', 'Arweave', 'Filecoin',
    'MetaMask', 'WalletConnect', 'Rainbow', 'Coinbase Wallet', 'Trust Wallet',
    'Phantom', 'Solflare', 'Exodus', 'Ledger', 'Trezor', 'KeepKey',
    'Uniswap', 'SushiSwap', 'PancakeSwap', 'Compound', 'Aave', 'MakerDAO',
    'Yearn Finance', 'Curve', 'Balancer', 'Synthetix', '1inch', '0x',
    'OpenSea', 'Rarible', 'SuperRare', 'Foundation', 'Async Art', 'KnownOrigin',
    'NBA Top Shot', 'CryptoKitties', 'Axie Infinity', 'Decentraland', 'Sandbox',
    
    // Static Site Generators
    'Jekyll', 'Hugo', 'Eleventy', '11ty', 'Hexo',
    'VuePress', 'VitePress', 'Docusaurus', 'GitBook', 'mdBook',
    'MkDocs', 'Bookdown', 'Quarto', 'Jupyter Book',
    'Zola', 'Cobalt', 'Gutenberg', 'Metalsmith', 'Assemble',
    'Harp', 'Brunch', 'Middleman', 'Nanoc', 'Awestruct', 'JBake',
    'Publish', 'Ink', 'Plot', 'Saga', 'Sapper', 'Elder.js',
    'Scully', 'Gridsome', 'Docsify', 'Slidev',
    'Reveal.js', 'Impress.js', 'Deck.js', 'Bespoke.js', 'Remark',
    
    // Otros lenguajes especializados
    'SQL',
    'RSocket', 'Apache Camel', 'Spring Integration', 'MuleSoft', 'WSO2',
    
    // Herramientas de desarrollo
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SourceForge', 'CodeCommit',
    'SVN', 'Mercurial', 'Bazaar', 'Perforce', 'Team Foundation Server',
    'Visual Studio Code', 'IntelliJ IDEA', 'Eclipse', 'NetBeans', 'Android Studio',
    'Xcode', 'Sublime Text', 'Atom', 'Vim', 'Neovim', 'Emacs',
    'WebStorm', 'PhpStorm', 'PyCharm', 'RubyMine', 'GoLand', 'CLion',
    'Rider', 'DataGrip', 'AppCode', 'Fleet', 'Nova', 'Brackets',
    'CodePen', 'JSFiddle', 'JSBin', 'AWS Cloud9', 'Koding',
    
    // Misceláneos
    'PWA', 'Deno', 'Bun',
    'Razor Pages', 'MVC', 'Web API',
    'WCF', 'SOAP', 'XML-RPC', 'JSON-RPC',
    'MessagePack', 'Avro', 'Cap\'n Proto',
    'FlatBuffers', 'Bond', 'Simple Binary Encoding', 'Kryo',
    'Lombok', 'MapStruct', 'Immutables', 'AutoValue', 'Dagger', 'Guice',
    'Spring', 'CDI', 'Weld', 'OpenWebbeans', 'HK2', 'Guava', 'Apache Commons',
    'Vavr', 'Eclipse Collections', 'FastUtil', 'Trove', 'HPPC', 'Koloboke'
  ];

  const basesDatos = [
    'MySQL',
    'PostgreSQL',
    'Microsoft SQL Server',
    'Oracle Database',
    'MariaDB',
    'SQLite',
    'IBM DB2',
    'SAP HANA',
    'Teradata',
    'Vertica',
    'Snowflake',
    'Amazon Redshift',
    'Google BigQuery',
    'Azure SQL Database',
    'Azure Synapse Analytics',
    'CockroachDB',
    'TiDB',
    'VoltDB',
    'MemSQL (SingleStore)',
    'NuoDB',
    'Greenplum',
    'Apache Impala',
    'Presto',
    'Apache Drill',
    'H2 Database',
    'HSQLDB',
    'Apache Derby',
    'Firebird',
    'InterBase',
    'Ingres',
    'MaxDB',
    'Sybase ASE',
    'Informix',
    'FileMaker',
    'Microsoft Access',
    'LibreOffice Base',
    'FoxPro',
    'dBASE',
    'Paradox',
    'MongoDB',
    'CouchDB',
    'Amazon DocumentDB',
    'Azure Cosmos DB',
    'ArangoDB',
    'RavenDB',
    'OrientDB',
    'Couchbase',
    'RethinkDB',
    'FaunaDB',
    'PouchDB',
    'ToroDB',
    'JsonDB',
    'UnQLite',
    'LokiJS',
    'NeDB',
    'Dexie.js',
    'Realm Database',
    'ObjectBox',
    'WiredTiger',
    'RocksDB',
    'Redis',
    'Amazon DynamoDB',
    'Apache Cassandra',
    'ScyllaDB',
    'Riak',
    'Voldemort',
    'Berkeley DB',
    'LevelDB',
    'LMDB',
    'Tokyo Cabinet',
    'Kyoto Cabinet',
    'Hazelcast',
    'Apache Ignite',
    'GridGain',
    'Coherence',
    'GemFire',
    'Infinispan',
    'Ehcache',
    'Memcached',
    'KeyDB',
    'Dragonfly',
    'Garnet',
    'Valkey',
    'SSDB',
    'LedisDB',
    'Badger',
    'BoltDB',
    'Bitcask',
    'Diskv',
    'HBase',
    'Amazon SimpleDB',
    'Google Bigtable',
    'Azure Table Storage',
    'Hypertable',
    'Accumulo',
    'Kudu',
    'ClickHouse',
    'Apache Druid',
    'Apache Pinot',
    'StarRocks',
    'Apache Doris',
    'MonetDB',
    'Vectorwise',
    'ParAccel',
    'Netezza',
    'Exadata',
    'Columnstore',
    'InfiniDB',
    'LucidDB',
    'C-Store',
    'Neo4j',
    'Amazon Neptune',
    'TigerGraph',
    'Dgraph',
    'JanusGraph',
    'Apache TinkerPop',
    'GraphDB',
    'AllegroGraph',
    'Virtuoso',
    'Blazegraph',
    'InfiniteGraph',
    'DEX',
    'FlockDB',
    'Titan',
    'HyperGraphDB',
    'InfoGrid',
    'Sparksee',
    'GraphBase',
    'AnzoGraph',
    'TerminusDB',
    'Memgraph',
    'RedisGraph',
    'AgensGraph',
    'Apache AGE',
    'InfluxDB',
    'TimescaleDB',
    'QuestDB',
    'KairosDB',
    'OpenTSDB',
    'Prometheus',
    'VictoriaMetrics',
    'M3DB',
    'Apache IoTDB',
    'GridDB',
    'TDengine',
    'Warp 10',
    'Riak TS',
    'AWS Timestream',
    'Azure Time Series Insights',
    'eXtremeDB',
    'TSDB',
    'Graphite',
    'RRDtool',
    'Whisper',
    'Carbon',
    'StatsD',
    'Telegraf',
    'Collectd',
    'Fluentd',
    'TimesTen',
    'Altibase',
    'EXASOL',
    'McObject',
    'FastDB',
    'HyperSQL',
    'H2',
    'Realm',
    'Aerospike',
    'MapDB',
    'JetBrains Xodus',
    'Berkeley DB JE',
    'Apache HBase',
    'Google Spanner',
    'FoundationDB',
    'YugabyteDB',
    'Apache Kudu',
    'Elasticsearch',
    'Solr Cloud',
    'Apache Phoenix',
    'Apache Calcite',
    'Apache Solr',
    'Amazon CloudSearch',
    'Azure Cognitive Search',
    'Algolia',
    'Swiftype',
    'Apache Lucene',
    'Sphinx',
    'Xapian',
    'Whoosh',
    'Tantivy',
    'Bleve',
    'MeiliSearch',
    'Typesense',
    'OpenSearch',
    'Vespa',
    'Amazon Kendra',
    'Microsoft Search',
    'Google Cloud Search',
    'Yandex Search',
    'Baidu Search',
    'Core Data',
    'Room (Android)',
    'SQLCipher',
    'Couchbase Lite',
    'IndexedDB',
    'WebSQL',
    'LocalStorage',
    'SessionStorage',
    'AsyncStorage',
    'MMKV',
    'Keychain Services',
    'Android Keystore',
    'Secure Storage',
    'Encrypted SharedPreferences',
    'UserDefaults',
    'NSUserDefaults',
    'Hive',
    'Isar',
    'Sembast',
    'Moor',
    'Floor',
    'Amazon RDS',
    'Amazon Aurora',
    'Amazon ElastiCache',
    'Amazon QLDB',
    'Azure Database for MySQL',
    'Azure Database for PostgreSQL',
    'Azure Cache for Redis',
    'Google Cloud SQL',
    'Google Cloud Spanner',
    'Google Firestore',
    'Google Memorystore',
    'Firebase Realtime Database',
    'Firebase Firestore',
    'Supabase',
    'PlanetScale',
    'Neon',
    'Xata',
    'Railway PostgreSQL',
    'Heroku Postgres',
    'MongoDB Atlas',
    'Redis Cloud',
    'ElasticCloud',
    'Aiven',
    'ScaleGrid',
    'ObjectRocket',
    'Compose',
    'mLab',
    'IPFS',
    'Arweave',
    'Filecoin',
    'Storj',
    'Sia',
    'Swarm',
    'OrbitDB',
    'Gun.js',
    'Ceramic Network',
    'The Graph',
    'BigchainDB',
    'Hyperledger Fabric',
    'R3 Corda',
    'MultiChain',
    'ChainCore',
    'Openchain',
    'Stellar',
    'Ripple',
    'Hedera Hashgraph',
    'IOTA Tangle',
    'Vedis',
    'WhiteDB',
    'Sophia',
    'EJDB',
    'TinyDB',
    'PickleDB',
    'ZODB',
    'Durus',
    'CodernityDB',
    'Buzhug',
    'KirbyBase',
    'Gadfly',
    'Metakit',
    'ThinkSQL',
    'Advantage Database',
    'Elevate DB',
    'NexusDB',
    'Apollo',
    'FlashFiler',
    'DBISAM',
    'Absolute Database',
    'AWS IoT Core',
    'Azure IoT Hub',
    'Google Cloud IoT',
    'ThingSpeak',
    'Losant',
    'Particle Cloud',
    'Blynk',
    'Cayenne',
    'Ubidots',
    'Thinger.io',
    'Adafruit IO',
    'Initial State',
    'Dweet.io',
    'Freeboard',
    'AllThingsTalk',
    'DeviceHive',
    'Kaa IoT',
    'ThingsBoard',
    'SiteWhere',
    'Mainflux',
    'EdgeX Foundry',
    'Apache Kafka',
    'Apache Pulsar',
    'RabbitMQ',
    'NATS',
    'Amazon SQS',
    'Azure Service Bus',
    'Google Pub/Sub',
    'Apache ActiveMQ',
    'ZeroMQ',
    'NSQ',
    'Apache BookKeeper',
    'Apache DistributedLog',
    'EventStore',
    'Apache Samza',
    'Apache Storm',
    'Apache Flink',
    'Apache Apex',
    'Apache NiFi',
    'Logstash',
    'Vector',
    'Fluent Bit',
    'rsyslog',
    'syslog-ng',
    'Graylog',
    'Splunk',
    'Sumo Logic',
    'Loggly',
    'Papertrail',
    'LogDNA',
    'No utiliza base de datos',
    'Solo archivos estáticos',
    'LocalStorage únicamente',
    'Archivos JSON',
    'Archivos XML',
    'Archivos CSV',
    'Archivos de texto plano',
    'Variables en memoria únicamente'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTecnologiaSelect = (tecnologia: string) => {
    if (tecnologia && !formData.tecnologias.includes(tecnologia)) {
      setFormData(prev => ({
        ...prev,
        tecnologias: [...prev.tecnologias, tecnologia]
      }));
    }
  };

  const removeTecnologia = (tecnologia: string) => {
    setFormData(prev => ({
      ...prev,
      tecnologias: prev.tecnologias.filter(t => t !== tecnologia)
    }));
  };

  const handleAddIntegrante = () => {
    setFormData(prev => ({
      ...prev,
      integrantes: [...prev.integrantes, { nombre: '', correo: '', matricula: '' }]
    }));
  };

  const handleRemoveIntegrante = (index: number) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.filter((_, i) => i !== index)
    }));
  };

  const handleIntegranteChange = (index: number, field: 'nombre' | 'correo' | 'matricula', value: string) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.map((integrante, i) => 
        i === index ? { ...integrante, [field]: value } : integrante
      )
    }));
  };

  // Filtrar tecnologías basado en la búsqueda
  const tecnologiasFiltradas = lenguajesDisponibles
    .filter(tech => !formData.tecnologias.includes(tech))
    .filter(tech => tech.toLowerCase().includes(searchTech.toLowerCase()))
    .slice(0, 50); // Limitar a 50 resultados para mejor rendimiento

  // Filtrar bases de datos basado en la búsqueda
  const basesDatosFiltradas = basesDatos
    .filter(db => db.toLowerCase().includes(searchDB.toLowerCase()))
    .slice(0, 50); // Limitar a 50 resultados para mejor rendimiento

  // Funciones para manejar el modal de "no usa base de datos"
  const handleNoDatabase = (opcion: string) => {
    setFormData(prev => ({
      ...prev,
      baseDatos: opcion
    }));
    setShowNoDatabaseModal(false);
  };

  const handleUsesDatabase = () => {
    setShowNoDatabaseModal(false);
    // Enfocus en el campo de base de datos
    setTimeout(() => {
      const dbSelect = document.querySelector('select[name="baseDatos"]') as HTMLSelectElement;
      if (dbSelect) {
        dbSelect.focus();
        dbSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Opciones para proyectos sin base de datos
  const opcionesSinBaseDatos = [
    'No utiliza base de datos',
    'Solo archivos estáticos',
    'LocalStorage únicamente',
    'Archivos JSON',
    'Archivos XML',
    'Archivos CSV',
    'Archivos de texto plano',
    'Variables en memoria únicamente'
  ];



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea un archivo PDF
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF (.pdf)');
        e.target.value = ''; // Limpiar el input
        return;
      }
      
      // Validar tamaño máximo (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB en bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo permitido: 50MB');
        e.target.value = ''; // Limpiar el input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        archivo: file
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Validar que sea un archivo PDF
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF (.pdf)');
        return;
      }
      
      // Validar tamaño máximo (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB en bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo permitido: 50MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        archivo: file
      }));
    }
  };

  // Funciones para manejar el modal de éxito
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    handleClose(); // Usa la función de cierre con animación
  };

  const handleGoToProjects = () => {
    setShowSuccessModal(false);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      navigate('/proyectos');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.tipoEstancia) {
      setErrorMessage('Debes seleccionar el tipo de proyecto');
      setShowErrorModal(true);
      return;
    }
    
    // Validar que se haya seleccionado un profesor asesor
    if (!formData.professor_id) {
      setErrorMessage('Debes seleccionar un profesor asesor');
      setShowErrorModal(true);
      return;
    }
    
    // Validar que se haya seleccionado al menos una tecnología
    if (formData.tecnologias.length === 0) {
      setErrorMessage('Debes seleccionar al menos una tecnología');
      setShowErrorModal(true);
      return;
    }
    
    // Validar que se haya subido un archivo PDF (obligatorio)
    if (!isEditMode && !formData.archivo) {
      setErrorMessage('Debes subir un archivo PDF de tu proyecto');
      setShowErrorModal(true);
      return;
    }
    
    // Validar base de datos - preguntar si no usa ninguna
    if (!formData.baseDatos) {
      setShowNoDatabaseModal(true);
      return;
    }
    
    // Función para generar matrícula por defecto si no hay email
    const generarMatriculaPorDefecto = (_nombre: string, index: number = 0): string => {
      return `202300${String(index + 100).padStart(3, '0')}`;
    };

    // Usar matrícula de la sesión activa o generar una por defecto
    const matriculaUsuario = user?.email ? extraerMatriculaDeEmail(user.email) : '';
    const matriculaFinal = matriculaUsuario || formData.matricula.trim() || generarMatriculaPorDefecto(formData.autor);
    const emailInstitucional = user?.email || `${matriculaFinal}@upqroo.edu.mx`;
    
    // Crear el objeto del proyecto
    const professorId = parseInt(formData.professor_id) || null;
    const nuevoProyecto = {
      id_proyecto: Date.now(), // ID temporal usando timestamp
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      asignatura: formData.tipoEstancia,
      cuatrimestre_id: 8,
      tipo: formData.tipoEstancia.toLowerCase().includes('estadía') ? 'estadía' : 'estancia',
      origen: 'inicial',
      periodo: new Date().getFullYear().toString(),
      url_repositorio: formData.githubLink,
      estatus: 'borrador',
      profesor_id: professorId,
      creado_en: new Date().toISOString(),
      autor: formData.autor,
      autorEmail: emailInstitucional, // Agregar email para organizar archivos
      programa: formData.programa,
      fechaDefensa: formData.fechaDefensa,
      baseDatos: formData.baseDatos,
      tecnologias: formData.tecnologias,
      archivo: formData.archivo?.name || null,
      cuatrimestre: { id_cuatri: 8, nombre: 'Octavo Cuatrimestre' },
      // Información del profesor asesor seleccionado
      profesor: professorId ? professors.find(p => p.id === professorId) || null : null,
      alumnos: [
        // Autor principal
        { 
          id_usuario: 2, 
          nombre: formData.autor, 
          email: emailInstitucional, 
          rol: 'alumno',
          matricula: matriculaFinal,
          creado_en: new Date().toISOString()
        },
        // Integrantes adicionales
        ...formData.integrantes
          .filter(integrante => integrante.nombre.trim()) // Solo incluir integrantes con nombre
          .map((integrante, index) => {
            // Extraer matrícula del correo si tiene, o generar una por defecto
            const matriculaDeCorreo = integrante.correo.trim() ? extraerMatriculaDeEmail(integrante.correo.trim()) : '';
            const matriculaIntegrante = matriculaDeCorreo || generarMatriculaPorDefecto(integrante.nombre, index + 1);
            const emailIntegrante = integrante.correo.trim() || `${matriculaIntegrante}@upqroo.edu.mx`;
            
            return {
              id_usuario: 3 + index,
              nombre: integrante.nombre.trim(),
              email: emailIntegrante,
              rol: 'alumno' as const,
              matricula: matriculaIntegrante,
              creado_en: new Date().toISOString()
            };
          })
      ]
    };

    try {
      setIsUploading(true);
      
      // Enviar proyecto a la API
      const selectedProfessor = professors.find(p => p.id === professorId);
      console.log('Sending project to API with professor:', {
        professorId,
        selectedProfessor,
        projectTitle: nuevoProyecto.titulo
      });
      console.log('Full project data:', nuevoProyecto);
      console.log('PROGRAMA SELECCIONADO EN FORM:', formData.programa);
      
      let response;
      if (isEditMode && projectToEdit) {
        // Modo edición - actualizar proyecto existente
        response = await projectsAPI.updateWithFile(projectToEdit.id_proyecto, nuevoProyecto, formData.archivo || undefined);
        console.log('Project updated successfully:', response);
      } else {
        // Modo creación - crear nuevo proyecto
        response = await projectsAPI.createWithFile(nuevoProyecto, formData.archivo || undefined);
        console.log('Project created successfully:', response);
      }
      
      setIsUploading(false);
      setShowSuccessModal(true);
      
    } catch (error) {
      setIsUploading(false);
      console.error('Error creating project:', error);
      
      // Mostrar error al usuario
      alert('Error al subir el proyecto. Por favor, inténtalo de nuevo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-all duration-500 ease-in-out ${
        isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Modal principal del formulario - oculto cuando se muestra el modal de éxito */}
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-500 ease-out ${
        showSuccessModal ? 'opacity-0 scale-95 pointer-events-none' : 
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Upload className="h-6 w-6" />
              <h2 className="text-2xl font-bold">{isEditMode ? 'Editar Proyecto' : 'Subir Proyecto'}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-orange-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-orange-100">
            Comparte tu trabajo de titulación con la comunidad universitaria
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4" />
              <span>Título del Proyecto</span>
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ingresa el título de tu proyecto..."
            />
          </div>

          {/* Autor */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4" />
              <span>Autor</span>
            </label>
            <input
              type="text"
              name="autor"
              value={formData.autor}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nombre completo del autor..."
            />
          </div>

          {/* Información de la sesión activa */}
          {user?.email && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-green-800">
                <GraduationCap className="h-4 w-4" />
                <span><strong>Sesión activa:</strong> {user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-700 mt-1">
                <span><strong>Matrícula:</strong> {extraerMatriculaDeEmail(user.email) || 'No detectada'}</span>
              </div>
            </div>
          )}

          {/* Integrantes adicionales */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                <span>Integrantes Adicionales</span>
              </label>
              <button
                type="button"
                onClick={handleAddIntegrante}
                className="flex items-center space-x-2 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar</span>
              </button>
            </div>
            
            {formData.integrantes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay integrantes adicionales. El proyecto es individual.</p>
            ) : (
              <div className="space-y-3">
                {formData.integrantes.map((integrante, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          value={integrante.nombre}
                          onChange={(e) => handleIntegranteChange(index, 'nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="Correo institucional (ej: 202300186@upqroo.edu.mx)"
                          value={integrante.correo}
                          onChange={(e) => handleIntegranteChange(index, 'correo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIntegrante(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Mostrar matrícula detectada del correo */}
                    {integrante.correo && (
                      <div className="text-xs text-blue-600 ml-1">
                        📧 Matrícula detectada: {extraerMatriculaDeEmail(integrante.correo) || 'No válida - debe iniciar con números'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              💡 Agrega manualmente el nombre y correo institucional de cada integrante. La matrícula se extraerá automáticamente del correo.
            </p>
          </div>

          {/* Tipo de Proyecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Proyecto
            </label>
            <select
              name="tipoEstancia"
              value={formData.tipoEstancia}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Selecciona el tipo...</option>
              <option value="Estancias I">Estancias I</option>
              <option value="Estancias II">Estancias II</option>
              <option value="Estadía">Estadía</option>
              <option value="Proyecto Integrador">Proyecto Integrador</option>
            </select>
          </div>

          {/* Asesor / Profesor */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>{formData.tipoEstancia === 'Proyecto Integrador' ? 'Profesor' : 'Asesor'}</span>
            </label>
            <select
              name="professor_id"
              value={formData.professor_id}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loadingProfessors}
            >
              <option value="">
                {loadingProfessors 
                  ? 'Cargando profesores...' 
                  : formData.tipoEstancia === 'Proyecto Integrador' 
                    ? 'Selecciona un profesor' 
                    : 'Selecciona un asesor'}
              </option>
              {professors.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nombre} - {professor.email}
                </option>
              ))}
            </select>
            {professors.length === 0 && !loadingProfessors && (
              <p className="text-xs text-red-500 mt-1">
                No hay profesores activos disponibles. Contacta al administrador.
              </p>
            )}
          </div>

          {/* Programa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programa Académico
            </label>
            <select
              name="programa"
              value={formData.programa}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Selecciona un programa...</option>
              {programas.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de defensa */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4" />
              <span>Fecha</span>
            </label>
            <input
              type="date"
              name="fechaDefensa"
              value={formData.fechaDefensa}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Link de GitHub */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Repositorio de GitHub</span>
            </label>
            <input
              type="url"
              name="githubLink"
              value={formData.githubLink}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="https://github.com/usuario/repositorio"
            />
          </div>

          {/* Base de datos */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                <path d="M12 7c-1.93 0-3.5.84-3.5 1.88v.24c0 1.04 1.57 1.88 3.5 1.88s3.5-.84 3.5-1.88v-.24C15.5 7.84 13.93 7 12 7z"/>
                <path d="M8.5 11.88c0 1.04 1.57 1.88 3.5 1.88s3.5-.84 3.5-1.88M8.5 14.88c0 1.04 1.57 1.88 3.5 1.88s3.5-.84 3.5-1.88"/>
              </svg>
              <span>Base de Datos</span>
            </label>
            
            {/* Mostrar base de datos seleccionada */}
            {formData.baseDatos ? (
              <div className="mb-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="font-medium text-orange-800">{formData.baseDatos}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, baseDatos: '' }))}
                    className="text-orange-600 hover:text-orange-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              /* Buscador de base de datos */
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchDB}
                  onChange={(e) => setSearchDB(e.target.value)}
                  placeholder="Buscar base de datos..."
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                
                {/* Botón para limpiar búsqueda */}
                {searchDB && (
                  <button
                    type="button"
                    onClick={() => setSearchDB('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Resultados de búsqueda */}
                {searchDB && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {basesDatosFiltradas.length > 0 ? (
                      basesDatosFiltradas.map((baseDatos) => (
                        <div
                          key={baseDatos}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, baseDatos }));
                            setSearchDB('');
                          }}
                          className="px-4 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-sm font-medium text-gray-800">{baseDatos}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 italic">
                        No se encontraron bases de datos que coincidan con "{searchDB}"
                      </div>
                    )}
                    {basesDatosFiltradas.length === 50 && (
                      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
                        Mostrando primeros 50 resultados. Sé más específico en tu búsqueda.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {!formData.baseDatos && !searchDB && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 italic">
                  Busca y selecciona la base de datos utilizada en tu proyecto
                </p>
                <p className="text-xs text-gray-400">
                  💡 Si no utiliza base de datos, busca: <span className="font-medium text-gray-600">"No utiliza base de datos"</span>
                </p>
              </div>
            )}
          </div>

          {/* Tecnologías */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>Tecnologías y Frameworks Utilizados</span>
            </label>
            
            {/* Buscador de tecnologías */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchTech}
                onChange={(e) => setSearchTech(e.target.value)}
                placeholder="Buscar tecnología/framework para agregar..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              
              {/* Botón para limpiar búsqueda */}
              {searchTech && (
                <button
                  type="button"
                  onClick={() => setSearchTech('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Resultados de búsqueda */}
              {searchTech && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {tecnologiasFiltradas.length > 0 ? (
                    tecnologiasFiltradas.map((tecnologia) => (
                      <div
                        key={tecnologia}
                        onClick={() => {
                          handleTecnologiaSelect(tecnologia);
                          setSearchTech('');
                        }}
                        className="px-4 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-800">{tecnologia}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500 italic">
                      No se encontraron tecnologías que coincidan con "{searchTech}"
                    </div>
                  )}
                  {tecnologiasFiltradas.length === 50 && (
                    <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
                      Mostrando primeros 50 resultados. Sé más específico en tu búsqueda.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tecnologías seleccionadas */}
            {formData.tecnologias.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Tecnologías/Frameworks seleccionados ({formData.tecnologias.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tecnologias.map((tecnologia) => (
                    <span
                      key={tecnologia}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200"
                    >
                      {tecnologia}
                      <button
                        type="button"
                        onClick={() => removeTecnologia(tecnologia)}
                        className="ml-2 text-orange-600 hover:text-orange-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No has seleccionado ninguna tecnología/framework (mínimo 1 requerida)</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Describe brevemente tu proyecto..."
            />
          </div>

          {/* Subir archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo PDF {isEditMode && <span className="text-gray-500 font-normal text-xs">(opcional - solo si deseas cambiar el archivo actual)</span>}
            </label>
            
            {/* Aviso para archivos de Drive - Solo móviles */}
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg md:hidden">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                     ¿Tu archivo está en Google Drive?
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    No podemos recibir archivos directamente desde Drive. Por favor, <strong>descarga primero el PDF a tu dispositivo</strong> y luego selecciónalo desde "Descargas".
                  </p>
                </div>
              </div>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {formData.archivo ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-orange-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">
                    {formData.archivo.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(formData.archivo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, archivo: null }))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Eliminar archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-orange-600">Haz clic para subir</span> o arrastra el archivo aquí
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Solo archivos PDF (máx. 50MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors"
                  >
                    Seleccionar archivo
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`flex-1 px-6 py-3 rounded-lg transition-all transform font-medium flex items-center justify-center space-x-2 ${
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Subir Proyecto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de éxito con animaciones deslizantes */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-in fade-in-0 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-500 ease-out animate-in slide-in-from-top-8 fade-in-0 zoom-in-95">
            <div className="p-8 text-center">
              {/* Icono de éxito con animación bounce */}
              <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-in zoom-in-50 duration-700 delay-300">
                <CheckCircle className="h-10 w-10 text-green-500 animate-in zoom-in-0 duration-700 delay-500 animate-bounce" />
              </div>
              
              {/* Título con animación desde arriba */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 animate-in slide-in-from-top-4 duration-600 delay-400">
                {isEditMode ? '¡Proyecto Actualizado!' : '¡Proyecto Subido!'}
              </h3>
              
              {/* Descripción con animación fade-in */}
              <p className="text-gray-600 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-600 delay-600">
                {isEditMode 
                  ? 'Tu proyecto ha sido actualizado exitosamente. Los cambios ya están disponibles para revisión.'
                  : 'Tu proyecto ha sido subido exitosamente a la base de datos. Ya está disponible para revisión.'}
              </p>
              
              {/* Botones con animación escalonada y efectos hover avanzados */}
              <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-600 delay-800">
                <button
                  onClick={handleGoToProjects}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl animate-in fade-in-0 duration-500 delay-1000 hover:rotate-1"
                >
                  Ver Todos los Proyectos
                </button>
                <button
                  onClick={handleSuccessClose}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-105 active:scale-95 animate-in fade-in-0 duration-500 delay-1100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar si no usa base de datos */}
      {showNoDatabaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold">Base de Datos</h3>
              </div>
              <p className="mt-2 text-orange-100">
                No seleccionaste ninguna base de datos
              </p>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                ¿Tu proyecto <strong>NO utiliza</strong> ningún tipo de base de datos?
              </p>

              <div className="space-y-4">
                {/* Si no usa base de datos */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Si no usa base de datos, selecciona una opción:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {opcionesSinBaseDatos.map((opcion) => (
                      <button
                        key={opcion}
                        onClick={() => handleNoDatabase(opcion)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-800 border border-transparent hover:border-orange-200 transition-colors"
                      >
                        <span className="text-sm font-medium">{opcion}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={handleUsesDatabase}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
                  >
                    Sí usa base de datos
                  </button>
                  <button
                    onClick={() => setShowNoDatabaseModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-bold">Tienes que subir tu PDF</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">{errorMessage}</p>

              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProject;