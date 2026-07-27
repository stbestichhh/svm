#!/usr/bin/env zx
import { spawnSync } from 'node:child_process';

$.verbose = false;

const VERSION = '1.19';
const CONFIG_DIR = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'svm');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config');

const SVM_LABEL = 'svm';

let mode = '';
let hasMount = false;
let persistName = '';
let targetName = '';
let provider = '';
let containerAction = '';
let cmdProvider = '';
const ports = [];


hasMount = argv.m ?? argv.mount ?? false;
persistName = argv.p ?? argv.persist ?? '';
cmdProvider = argv.provider ?? '';
ports.push(...[].concat(argv.P ?? argv.port ?? []));

const [cmd, arg1] = argv._;
mode = cmd ?? '';

const handleMode = {
    system: () => { containerAction = arg1 },
    provider: () => { provider = arg1 },
    open: () => { targetName = arg1 },
    remove: () => { mode = 'remove'; targetName = arg1 },
    rm: () => { mode = 'remove'; targetName = arg1 },
    ls: () => { mode = 'list' },
    list: () => {},
    node: () => {},
    ubuntu: () => {},
    debian: () => {},
    status: () => {},
    help: () => {},
    version: () => {},
    '': () => { mode = 'help' },
}

const modeHandler = handleMode[mode] || (() => {
    console.log(`Unknown argument: ${mode}`);
    process.exit(1);
});

modeHandler();

if (argv.h || argv.help) mode = 'help';
if (argv.v || argv.version) mode = 'version';

function saveProvider(p) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, `${p}\n`);
}

function getProvider() {
    if (fs.existsSync(CONFIG_FILE)) {
        return fs.readFileSync(CONFIG_FILE, 'utf8').trim();
    }
    return 'docker';
}

function getCurrentProvider() {
    return cmdProvider || getProvider();
}

async function checkProviderAvailable() {
    const p = getCurrentProvider();
    if (p === 'docker') {
        try {
            await which('docker');
        } catch {
            console.error("Error: 'docker' is not installed or not in PATH");
            process.exit(1);
        }
    } else if (p === 'osx') {
        try {
            await which('container');
        } catch {
            console.error("Error: Apple 'container' CLI is not installed or not in PATH");
            process.exit(1);
        }
    } else {
        console.error(`Error: Unknown provider '${p}'`);
        process.exit(1);
    }
}

function setProvider() {
    if (provider === 'docker' || provider === 'osx') {
        saveProvider(provider);
        console.log(`Provider set to: ${provider}`);
    } else {
        console.log(`Unknown provider: ${provider}`);
        console.log('Available providers: docker, osx');
        process.exit(1);
    }
}

async function containerExists(name) {
    if (getCurrentProvider() === 'docker') {
        const { stdout } = await $`docker ps -a --format {{.Names}}`;
        return stdout.split('\n').includes(name);
    }
    const { stdout } = await $`container ls -a --format json`;
    return stdout.includes(`"id":"${name}"`);
}

async function createContainer(image, workdir, name) {
    const portArgs = ports.flatMap((p) => ['-p', p]);

    if (getCurrentProvider() === 'docker') {
        if (hasMount) {
            await $({ stdio: 'inherit' })`docker create -it --name ${name} --label ${SVM_LABEL}=true ${portArgs} -v ${process.cwd()}:${workdir} -w ${workdir} ${image} bash`;
        } else {
            await $({ stdio: 'inherit' })`docker create -it --name ${name} --label ${SVM_LABEL}=true ${portArgs} ${image} bash`;
        }
    } else {
        if (hasMount) {
            await $({ stdio: 'inherit' })`container run -d --name ${name} --label ${SVM_LABEL}=true ${portArgs} --mount type=bind,source=${process.cwd()},target=${workdir} -w ${workdir} ${image} sleep infinity`;
        } else {
            await $({ stdio: 'inherit' })`container run -d --name ${name} --label ${SVM_LABEL}=true ${portArgs} ${image} sleep infinity`;
        }
    }
}

async function attachContainer(name) {
    if (getCurrentProvider() === 'docker') {
        await $({ stdio: 'inherit' })`docker start -ai ${name}`;
        return;
    }

    const { stdout } = await $`container ls --format json`;
    if (!stdout.includes(`"id":"${name}"`)) {
        console.log(`Starting ${name}...`);
        await $`container start ${name}`;
    }

    process.on('exit', () => {
        console.log(`Stopping ${name}...`);
        spawnSync('container', ['stop', name]);
    });

    await $({ stdio: 'inherit' })`container exec -it ${name} bash`;
}

async function runEphemeral(image, workdir) {
    const portArgs = ports.flatMap((p) => ['-p', p]);

    if (getCurrentProvider() === 'docker') {
        if (hasMount) {
            await $({ stdio: 'inherit' })`docker run -it --rm --label ${SVM_LABEL}=true ${portArgs} -v ${process.cwd()}:${workdir} -w ${workdir} ${image} bash`;
        } else {
            await $({ stdio: 'inherit' })`docker run -it --rm --label ${SVM_LABEL}=true ${portArgs} ${image} bash`;
        }
        return;
    }

    const cmdArgs = ['run', '--rm', '-it', '--label', `${SVM_LABEL}=true`, ...portArgs];
    if (hasMount) {
        cmdArgs.push('--mount', `type=bind,source=${process.cwd()},target=${workdir}`, '-w', workdir);
    }
    cmdArgs.push(image, 'bash');
    await $({ stdio: 'inherit' })`container ${cmdArgs}`;
}

function printTable(header, rows) {
    const all = [header, ...rows];
    const widths = header.map((_, col) => Math.max(...all.map((r) => String(r[col]).length)));
    for (const row of all) {
        console.log(row.map((cell, idx) => String(cell).padEnd(widths[idx])).join('  '));
    }
}

async function listOsxSvm() {
    let json = [];
    try {
        const { stdout } = await $`container ls -a --format json`;
        json = JSON.parse(stdout || '[]');
    } catch {
        json = [];
    }

    const rows = json
        .filter((c) => c.configuration?.labels?.[SVM_LABEL] === 'true')
        .map((c) => [
            c.id,
            c.configuration?.image?.reference ?? '-',
            c.status?.state ?? '-',
            c.status?.networks?.[0]?.ipv4Address ?? '-',
            (c.configuration?.publishedPorts ?? [])
                .map((p) => `${p.hostPort}:${p.containerPort}/${p.proto}`)
                .join(',') || '-',
        ]);

    printTable(['ID', 'IMAGE', 'STATE', 'IP', 'PORTS'], rows);
}

async function listDockerSvm() {
    const { stdout: idsRaw } = await $`docker ps -a --filter label=${SVM_LABEL}=true --format {{.ID}}`;
    const ids = idsRaw.split('\n').filter(Boolean);

    const rows = [];
    if (ids.length) {
        const { stdout } = await $`docker inspect ${ids}`;
        const data = JSON.parse(stdout);
        for (const c of data) {
            const name = c.Name.replace(/^\//, '');
            const bindings = c.HostConfig?.PortBindings ?? {};
            const portsStr =
                Object.entries(bindings)
                    .flatMap(([containerPort, hostList]) => (hostList ?? []).map((h) => `${h.HostPort}:${containerPort}`))
                    .join(',') || '-';
            rows.push([name, c.Config.Image, c.State.Status, portsStr]);
        }
    }

    printTable(['NAME', 'IMAGE', 'STATE', 'PORTS'], rows);
}

function listContainers() {
    return getCurrentProvider() === 'docker' ? listDockerSvm() : listOsxSvm();
}

async function removeContainer(name) {
    if (getCurrentProvider() === 'docker') {
        await $`docker rm -f ${name}`;
    } else {
        await $`container rm -f ${name}`;
    }
}

async function runContainer(image, workdir) {
    if (ports.length) console.log(`Publishing ports: ${ports.join(' ')}`);

    if (persistName) {
        if (await containerExists(persistName)) {
            if (ports.length) {
                console.error(`Note: '${persistName}' already exists; ports are fixed at creation and cannot be changed here.`);
                console.error(` Remove it (svm remove ${persistName}) and recreate to change published ports.`);
            }
        } else {
            await createContainer(image, workdir, persistName);
        }
        await attachContainer(persistName);
        return;
    }

    await runEphemeral(image, workdir);
}

const runNode = () => runContainer('node:22', '/app');
const runUbuntu = () => runContainer('ubuntu', '/workspace');
const runDebian = () => runContainer('debian:latest', '/workspace');

async function cmdLs() {
    console.log('Active svm environments:');
    await listContainers();
}

async function cmdOpen() {
    if (!targetName) {
        console.log('Usage: svm open <name>');
        process.exit(1);
    }
    if (!(await containerExists(targetName))) {
        console.log(`Container '${targetName}' not found`);
        process.exit(1);
    }
    await attachContainer(targetName);
}

async function cmdRemove() {
    if (!targetName) {
        console.log('Usage: svm remove <name>');
        process.exit(1);
    }
    if (await containerExists(targetName)) {
        await removeContainer(targetName);
        console.log(`Removed ${targetName}`);
    } else {
        console.log(`Container '${targetName}' not found`);
    }
}

async function cmdSystem() {
    if (!containerAction) {
        console.log('Usage: svm system <start|stop>');
        process.exit(1);
    }
    if (getCurrentProvider() === 'docker') {
        console.log('Docker does not require system management via svm');
    } else {
        await $({ stdio: 'inherit' })`container system ${containerAction}`;
    }
}

function showHelp() {
    console.log(`svm - simple container sandbox manager

Usage:
  svm <node|ubuntu|debian> [options]
  svm ls
  svm open <name>
  svm remove <name>

Commands:
  provider <docker|osx>      Set preferred provider (default: docker)
  system <start|stop>        Control provider service (osx only)
  status                     Show provider and environment info
  node                       Node.js environment (node:22)
  ubuntu                     Ubuntu environment
  debian                     Debian environment (debian:latest)
  ls                         List environments
  open <name>                Attach to a persistent environment
  remove <name>              Delete an environment

Options:
  -m, --mount                Mount current directory into the container
  -p, --persist <name>       Use a named persistent container
  -P, --port <spec>          Publish a port to the host (host:container[/proto]);
                             repeatable. Applied at container creation.
  --provider <docker|osx>    Override provider for this command only

Examples:
  svm node -p api
  svm node -m
  svm node -P 3000:3000
  svm node -p api -P 8080:80 -P 5432:5432
  svm ls
  svm open api
  svm remove api
  svm provider osx
  svm system start
  svm node --provider osx`);
}

function showVersion() {
    console.log(`v${VERSION}`);
}

async function showStatus() {
    const currentProvider = getCurrentProvider();
    console.log(`svm v${VERSION}\n`);
    console.log(`Provider: ${currentProvider}`);

    let status = 'unknown';
    try {
        if (currentProvider === 'docker') {
            await $`docker info`.quiet();
        } else {
            await $`container system status`.quiet();
        }
        status = 'running';
    } catch {
        status = 'stopped';
    }
    console.log(`Status: ${status}`);

    console.log(fs.existsSync(CONFIG_FILE) ? `Config: ${CONFIG_FILE}` : 'Config: not set (using default: docker)');

    console.log('\nPersistent containers:');
    let count = 0;
    if (currentProvider === 'docker') {
        const { stdout } = await $`docker ps -a --filter label=${SVM_LABEL}=true --format {{.Names}}`;
        count = stdout.split('\n').filter(Boolean).length;
    } else {
        try {
            const { stdout } = await $`container ls -a --format json`;
            const json = JSON.parse(stdout || '[]');
            count = json.filter((c) => c.configuration?.labels?.[SVM_LABEL] === 'true').length;
        } catch {
            count = 0;
        }
    }
    console.log(` ${count} container(s)`);

    console.log('\nAvailable environments:');
    console.log('  node      node:22');
    console.log('  ubuntu    ubuntu');
    console.log('  debian    debian:latest');
}

const withProvider = (fn) => async () => {
    await checkProviderAvailable();
    await fn();
};

const router = {
    provider: () => setProvider(),
    system: withProvider(cmdSystem),
    node: withProvider(runNode),
    ubuntu: withProvider(runUbuntu),
    debian: withProvider(runDebian),
    list: withProvider(cmdLs),
    open: withProvider(cmdOpen),
    remove: withProvider(cmdRemove),
    help: () => showHelp(),
    version: () => showVersion(),
    status: () => showStatus(),
};

const handler = router[mode];
if (handler) {
    await handler();
} else {
    showHelp();
    process.exitCode = 1;
}
