// src/lib/CoordinateSystem.js

export class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  subtract(other) {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  scale(factor) {
    return new Vector2D(this.x * factor, this.y * factor);
  }
}

export class NodeBounds {
  constructor(position, width, height) {
    this.position = position;
    this.width = width;
    this.height = height;
  }

  get center() {
    return new Vector2D(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );
  }
}

export class CoordinateSystem {
  constructor() {
    this.nodes = new Map();
    this.scale = 1;
    this.offset = new Vector2D(0, 0);
  }

  setNodeBounds(nodeId, bounds) {
    console.log(`CoordinateSystem: Setting bounds for node ${nodeId}`, bounds);
    this.nodes.set(nodeId, bounds);
  }

  getNodeBounds(nodeId) {
    return this.nodes.get(nodeId);
  }

  getNodeCenter(nodeId) {
    const bounds = this.nodes.get(nodeId);
    if (!bounds) {
      console.warn(`CoordinateSystem: No bounds found for node ${nodeId}`);
      return null;
    }
    return bounds.center;
  }

  toScreen(position) {
    const scaled = position.scale(this.scale);
    return scaled.add(this.offset);
  }

  toLogical(position) {
    const translated = position.subtract(this.offset);
    return translated.scale(1 / this.scale);
  }

  updateTransform(scale, offset) {
    this.scale = scale;
    this.offset = offset;
  }
}

export class ConnectionManager {
  constructor(coordinateSystem) {
    this.coordinates = coordinateSystem;
    this.connections = new Map();
  }

  setConnection(sourceId, targetId, type = 'default') {
    console.log(`ConnectionManager: Setting up connection ${sourceId} -> ${targetId} (${type})`);
    const id = `${sourceId}-${targetId}`;
    
    const sourceCenter = this.coordinates.getNodeCenter(sourceId);
    const targetCenter = this.coordinates.getNodeCenter(targetId);

    if (!sourceCenter || !targetCenter) {
      console.warn(`ConnectionManager: Missing centers for connection ${id}`);
      return;
    }

    this.connections.set(id, {
      id,
      sourceId,
      targetId,
      type,
      from: sourceCenter,
      to: targetCenter,
      points: this.calculateManhattanPoints(sourceCenter, targetCenter)
    });
  }

  calculateManhattanPoints(start, end) {
    const verticalFirst = Math.abs(end.y - start.y) > Math.abs(end.x - start.x);
    
    if (verticalFirst) {
      const midY = start.y + (end.y - start.y) / 2;
      return [
        start,
        new Vector2D(start.x, midY),
        new Vector2D(end.x, midY),
        end
      ];
    } else {
      const midX = start.x + (end.x - start.x) / 2;
      return [
        start,
        new Vector2D(midX, start.y),
        new Vector2D(midX, end.y),
        end
      ];
    }
  }

  getScreenConnections() {
    console.log('ConnectionManager: Getting screen connections');
    const screenConnections = Array.from(this.connections.values()).map(conn => ({
      ...conn,
      from: this.coordinates.toScreen(conn.from),
      to: this.coordinates.toScreen(conn.to),
      points: conn.points.map(p => this.coordinates.toScreen(p))
    }));
    
    console.log('Screen connections:', screenConnections);
    return screenConnections;
  }

  updateNodeConnections(nodeId) {
    console.log(`ConnectionManager: Updating connections for node ${nodeId}`);
    // Update connections where this node is source or target
    this.connections.forEach((conn, id) => {
      if (conn.sourceId === nodeId || conn.targetId === nodeId) {
        this.setConnection(conn.sourceId, conn.targetId, conn.type);
      }
    });
  }

  clear() {
    console.log('ConnectionManager: Clearing all connections');
    this.connections.clear();
  }
}