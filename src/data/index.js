const modules = import.meta.glob('./**/*.json', { eager: true });

export const getChapterData = (bookId, chapterId) => {
  const path = `./${bookId}/${chapterId}.json`;
  const module = modules[path];

  if (!module) {
    console.error(`Missing data for ${bookId}/${chapterId}`);
    return null;
  }

  return module.default || module;
};

export const getBookConfig = (bookId) => {
  const path = `./${bookId}/config.json`;
  return modules[path] ? (modules[path].default || modules[path]) : null;
};

export const getAvailableChapters = (bookId) => {
  const chapters = [];
  for (const path in modules) {
    if (path.startsWith(`./${bookId}/`) && path.includes('chapter')) {
      const data = modules[path].default || modules[path];
      chapters.push({ id: data.id, title: data.title });
    }
  }
  return chapters.sort((a, b) => {
    const numA = parseInt(a.id.replace('chapter', ''), 10);
    const numB = parseInt(b.id.replace('chapter', ''), 10);
    return numA - numB;
  });
};
