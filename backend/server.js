const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const scanRoutes = require('./src/routes/scan.routes');
const vulnRoutes = require('./src/routes/vuln.routes');
const fpRoutes = require('./src/routes/fp.routes');
const assetRoutes = require('./src/routes/asset.routes');
const reportRoutes = require('./src/routes/report.routes');
const topologyRoutes = require('./src/routes/topology.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan((tokens, req, res) => {
  return [
    `\x1b[36m[${new Date().toISOString().replace('T', ' ').substring(0, 19)}]\x1b[0m`,
    `\x1b[33m${tokens.method(req, res)}\x1b[0m`,
    tokens.url(req, res),
    tokens.status(req, res) >= 400 ? `\x1b[31m${tokens.status(req, res)}\x1b[0m` : `\x1b[32m${tokens.status(req, res)}\x1b[0m`,
    '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
}));

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/vulns', vulnRoutes);
app.use('/api/fp', fpRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/topology', topologyRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`VulnScan Pro backend securely running on port ${PORT}`);
});
