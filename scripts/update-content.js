const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const galleryDir = path.join(rootDir, 'gallery');
const contentPath = path.join(rootDir, 'data', 'content.json');

const categories = [
  { name: '홈페이지', idPrefix: 'home-web' },
  { name: '아이콘', idPrefix: 'home-icon' },
  { name: '개인작', idPrefix: 'home-personal' },
  { name: '커미션', idPrefix: 'home-commission' }
];

const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function readJsonSafe(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function sortFolderNames(names) {
  const numeric = names.every((name) => /^\d+$/.test(name));
  if (numeric) {
    return names.sort((a, b) => Number(a) - Number(b));
  }
  return names.sort((a, b) => a.localeCompare(b));
}

function listProjects(category) {
  const catDir = path.join(galleryDir, category.name);
  if (!fs.existsSync(catDir)) return [];

  const folders = fs
    .readdirSync(catDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return sortFolderNames(folders).map((folder) => {
    const folderDir = path.join(catDir, folder);
    const files = fs
      .readdirSync(folderDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => imageExts.has(path.extname(name).toLowerCase()));

    const thumbFile = files.find((name) => /^thum/i.test(name));
    const otherFiles = files.filter((name) => name !== thumbFile);
    otherFiles.sort((a, b) => a.localeCompare(b));

    const thumbPath = thumbFile
      ? toPosix(path.relative(rootDir, path.join(folderDir, thumbFile)))
      : '';

    const images = [];
    if (thumbPath) images.push(thumbPath);
    otherFiles.forEach((file) => {
      images.push(toPosix(path.relative(rootDir, path.join(folderDir, file))));
    });

    return {
      id: `${category.idPrefix}-${folder}`,
      category: category.name,
      title: `${category.name} ${folder}`,
      thumb: thumbPath,
      images
    };
  });
}

function mergeItem(project, oldItem) {
  const safeDesc = Array.isArray(oldItem?.description) ? oldItem.description : [];
  return {
    id: project.id,
    category: project.category,
    title: oldItem?.title?.trim() ? oldItem.title : project.title,
    thumb: project.thumb,
    meta: oldItem?.meta || '',
    created: oldItem?.created || '',
    updated: oldItem?.updated || '',
    link: oldItem?.link || '',
    description: safeDesc,
    images: project.images
  };
}

function buildContent() {
  const old = readJsonSafe(contentPath) || {};
  const oldMap = new Map();
  (old.gallery || []).forEach((item) => {
    if (item && item.id) oldMap.set(item.id, item);
  });

  const gallery = categories.flatMap((category) => {
    const projects = listProjects(category);
    return projects.map((project) => mergeItem(project, oldMap.get(project.id)));
  });

  return {
    gallery,
    timeline: Array.isArray(old.timeline) ? old.timeline : [],
    friends: Array.isArray(old.friends) ? old.friends : []
  };
}

function run() {
  const data = buildContent();
  fs.mkdirSync(path.dirname(contentPath), { recursive: true });
  fs.writeFileSync(contentPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log('Updated data/content.json');
}

run();
