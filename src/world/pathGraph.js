export function findPath(graph, start, goal) {
  if (start === goal) return [start];
  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    for (const next of (graph.edges[node] || [])) {
      if (visited.has(next)) continue;
      if (next === goal) return [...path, next];
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return null;
}
