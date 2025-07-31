export interface PhysicsParticle {
  position: Float32Array; // x, y, z
  velocity: Float32Array; // vx, vy, vz
  acceleration: Float32Array; // ax, ay, az
  rotation: Float32Array; // rx, ry, rz (euler angles)
  angularVelocity: Float32Array; // wx, wy, wz
  mass: number;
  lifetime: number;
  age: number;
  scale: number;
  damping: number;
}

export interface PhysicsForce {
  type: 'gravity' | 'wind' | 'explosion' | 'vortex' | 'attractor';
  position?: Float32Array;
  direction?: Float32Array;
  strength: number;
  radius?: number;
  falloff?: number;
}

export interface PhysicsConfig {
  gravity?: Float32Array;
  damping?: number;
  timeStep?: number;
  maxLifetime?: number;
  restitution?: number; // bounciness
  friction?: number;
}

export class PhysicsEngine {
  private particles: PhysicsParticle[] = [];
  private forces: PhysicsForce[] = [];
  private config: Required<PhysicsConfig>;
  private bounds: { min: Float32Array; max: Float32Array } | null = null;

  constructor(config: PhysicsConfig = {}) {
    this.config = {
      gravity: config.gravity || new Float32Array([0, -9.81, 0]),
      damping: config.damping ?? 0.98,
      timeStep: config.timeStep ?? 1 / 60,
      maxLifetime: config.maxLifetime ?? 5.0,
      restitution: config.restitution ?? 0.5,
      friction: config.friction ?? 0.1,
    };
  }

  createParticle(options: Partial<PhysicsParticle> = {}): PhysicsParticle {
    const particle: PhysicsParticle = {
      position: options.position || new Float32Array([0, 0, 0]),
      velocity: options.velocity || new Float32Array([0, 0, 0]),
      acceleration: options.acceleration || new Float32Array([0, 0, 0]),
      rotation: options.rotation || new Float32Array([0, 0, 0]),
      angularVelocity: options.angularVelocity || new Float32Array([0, 0, 0]),
      mass: options.mass ?? 1.0,
      lifetime: options.lifetime ?? this.config.maxLifetime,
      age: options.age ?? 0,
      scale: options.scale ?? 1.0,
      damping: options.damping ?? this.config.damping,
    };

    this.particles.push(particle);
    return particle;
  }

  createParticlesFromTriangles(
    triangleCenters: Float32Array[],
    initialVelocity?: (index: number, center: Float32Array) => Float32Array,
  ): PhysicsParticle[] {
    return triangleCenters.map((center, index) => {
      const velocity = initialVelocity
        ? initialVelocity(index, center)
        : new Float32Array([0, 0, 0]);

      return this.createParticle({
        position: new Float32Array(center),
        velocity,
        angularVelocity: new Float32Array([
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ]),
        scale: 1.0,
        lifetime: this.config.maxLifetime,
      });
    });
  }

  addForce(force: PhysicsForce): void {
    this.forces.push(force);
  }

  removeForce(force: PhysicsForce): void {
    const index = this.forces.indexOf(force);
    if (index !== -1) {
      this.forces.splice(index, 1);
    }
  }

  setBounds(min: Float32Array, max: Float32Array): void {
    this.bounds = { min, max };
  }

  update(deltaTime?: number): void {
    const dt = deltaTime ?? this.config.timeStep;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle) continue;

      // Update age and check lifetime
      particle.age += dt;
      if (particle.age >= particle.lifetime) {
        this.particles.splice(i, 1);
        continue;
      }

      // Reset acceleration
      particle.acceleration[0] = 0;
      particle.acceleration[1] = 0;
      particle.acceleration[2] = 0;

      // Apply gravity
      particle.acceleration[0] += this.config.gravity[0] ?? 0;
      particle.acceleration[1] += this.config.gravity[1] ?? 0;
      particle.acceleration[2] += this.config.gravity[2] ?? 0;

      // Apply forces
      for (const force of this.forces) {
        this.applyForce(particle, force);
      }

      // Update velocity
      const a0 = particle.acceleration[0] ?? 0;
      const a1 = particle.acceleration[1] ?? 0;
      const a2 = particle.acceleration[2] ?? 0;
      particle.velocity[0] = (particle.velocity[0] ?? 0) + a0 * dt;
      particle.velocity[1] = (particle.velocity[1] ?? 0) + a1 * dt;
      particle.velocity[2] = (particle.velocity[2] ?? 0) + a2 * dt;

      // Apply damping
      particle.velocity[0] = (particle.velocity[0] ?? 0) * particle.damping;
      particle.velocity[1] = (particle.velocity[1] ?? 0) * particle.damping;
      particle.velocity[2] = (particle.velocity[2] ?? 0) * particle.damping;

      // Update position
      particle.position[0] = (particle.position[0] ?? 0) + (particle.velocity[0] ?? 0) * dt;
      particle.position[1] = (particle.position[1] ?? 0) + (particle.velocity[1] ?? 0) * dt;
      particle.position[2] = (particle.position[2] ?? 0) + (particle.velocity[2] ?? 0) * dt;

      // Update rotation
      particle.rotation[0] = (particle.rotation[0] ?? 0) + (particle.angularVelocity[0] ?? 0) * dt;
      particle.rotation[1] = (particle.rotation[1] ?? 0) + (particle.angularVelocity[1] ?? 0) * dt;
      particle.rotation[2] = (particle.rotation[2] ?? 0) + (particle.angularVelocity[2] ?? 0) * dt;

      // Apply angular damping
      const av0 = particle.angularVelocity[0];
      const av1 = particle.angularVelocity[1];
      const av2 = particle.angularVelocity[2];
      if (av0 !== undefined) particle.angularVelocity[0] = av0 * particle.damping;
      if (av1 !== undefined) particle.angularVelocity[1] = av1 * particle.damping;
      if (av2 !== undefined) particle.angularVelocity[2] = av2 * particle.damping;

      // Check bounds collision
      if (this.bounds) {
        this.checkBoundsCollision(particle);
      }
    }
  }

  private applyForce(particle: PhysicsParticle, force: PhysicsForce): void {
    const forceVector = new Float32Array([0, 0, 0]);

    switch (force.type) {
      case 'gravity':
        if (force.direction) {
          const d0 = force.direction[0];
          const d1 = force.direction[1];
          const d2 = force.direction[2];
          if (d0 !== undefined) forceVector[0] = d0 * force.strength;
          if (d1 !== undefined) forceVector[1] = d1 * force.strength;
          if (d2 !== undefined) forceVector[2] = d2 * force.strength;
        }
        break;

      case 'wind':
        if (force.direction) {
          const d0 = force.direction[0];
          const d1 = force.direction[1];
          const d2 = force.direction[2];
          if (d0 !== undefined) forceVector[0] = d0 * force.strength;
          if (d1 !== undefined) forceVector[1] = d1 * force.strength;
          if (d2 !== undefined) forceVector[2] = d2 * force.strength;
        }
        break;

      case 'explosion':
        if (force.position) {
          const px = particle.position[0] ?? 0;
          const py = particle.position[1] ?? 0;
          const pz = particle.position[2] ?? 0;
          const fx = force.position[0] ?? 0;
          const fy = force.position[1] ?? 0;
          const fz = force.position[2] ?? 0;
          const dx = px - fx;
          const dy = py - fy;
          const dz = pz - fz;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (force.radius && distance < force.radius) {
            const factor = 1 - distance / force.radius;
            const power = force.strength * factor * factor; // quadratic falloff

            if (distance > 0.001) {
              forceVector[0] = (dx / distance) * power;
              forceVector[1] = (dy / distance) * power;
              forceVector[2] = (dz / distance) * power;
            }
          }
        }
        break;

      case 'vortex':
        if (force.position) {
          const px = particle.position[0] ?? 0;
          const py = particle.position[1] ?? 0;
          const fx = force.position[0] ?? 0;
          const fy = force.position[1] ?? 0;
          const dx = px - fx;
          const dy = py - fy;
          const distance2D = Math.sqrt(dx * dx + dy * dy);

          if (distance2D > 0.001) {
            // Tangential force
            const tangentX = -dy / distance2D;
            const tangentY = dx / distance2D;

            // Inward force
            const inwardX = -dx / distance2D;
            const inwardY = -dy / distance2D;

            const factor = force.strength / (1 + distance2D * 0.1);

            forceVector[0] = tangentX * factor + inwardX * factor * 0.1;
            forceVector[1] = tangentY * factor + inwardY * factor * 0.1;
            forceVector[2] = 0;
          }
        }
        break;

      case 'attractor':
        if (force.position) {
          const px = particle.position[0] ?? 0;
          const py = particle.position[1] ?? 0;
          const pz = particle.position[2] ?? 0;
          const fx = force.position[0] ?? 0;
          const fy = force.position[1] ?? 0;
          const fz = force.position[2] ?? 0;
          const dx = fx - px;
          const dy = fy - py;
          const dz = fz - pz;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance > 0.001) {
            const factor = force.strength / (distance * distance); // inverse square law
            forceVector[0] = (dx / distance) * factor;
            forceVector[1] = (dy / distance) * factor;
            forceVector[2] = (dz / distance) * factor;
          }
        }
        break;
    }

    // Apply force to acceleration (F = ma, so a = F/m)
    const fv0 = forceVector[0] ?? 0;
    const fv1 = forceVector[1] ?? 0;
    const fv2 = forceVector[2] ?? 0;
    const a0 = particle.acceleration[0];
    const a1 = particle.acceleration[1];
    const a2 = particle.acceleration[2];
    if (a0 !== undefined) particle.acceleration[0] = a0 + fv0 / particle.mass;
    if (a1 !== undefined) particle.acceleration[1] = a1 + fv1 / particle.mass;
    if (a2 !== undefined) particle.acceleration[2] = a2 + fv2 / particle.mass;
  }

  private checkBoundsCollision(particle: PhysicsParticle): void {
    if (!this.bounds) return;

    // Check X bounds
    const posX = particle.position[0] ?? 0;
    const minX = this.bounds.min[0] ?? 0;
    const maxX = this.bounds.max[0] ?? 0;
    if (posX < minX) {
      particle.position[0] = minX;
      const v0 = particle.velocity[0];
      const v1 = particle.velocity[1];
      const v2 = particle.velocity[2];
      if (v0 !== undefined) particle.velocity[0] = v0 * -this.config.restitution;
      if (v1 !== undefined) particle.velocity[1] = v1 * (1 - this.config.friction);
      if (v2 !== undefined) particle.velocity[2] = v2 * (1 - this.config.friction);
    } else if (posX > maxX) {
      particle.position[0] = maxX;
      const v0 = particle.velocity[0];
      const v1 = particle.velocity[1];
      const v2 = particle.velocity[2];
      if (v0 !== undefined) particle.velocity[0] = v0 * -this.config.restitution;
      if (v1 !== undefined) particle.velocity[1] = v1 * (1 - this.config.friction);
      if (v2 !== undefined) particle.velocity[2] = v2 * (1 - this.config.friction);
    }

    // Check Y bounds
    const posY = particle.position[1] ?? 0;
    const minY = this.bounds.min[1] ?? 0;
    const maxY = this.bounds.max[1] ?? 0;
    if (posY < minY) {
      particle.position[1] = minY;
      const v0 = particle.velocity[0];
      const v1 = particle.velocity[1];
      const v2 = particle.velocity[2];
      if (v1 !== undefined) particle.velocity[1] = v1 * -this.config.restitution;
      if (v0 !== undefined) particle.velocity[0] = v0 * (1 - this.config.friction);
      if (v2 !== undefined) particle.velocity[2] = v2 * (1 - this.config.friction);
    } else if (posY > maxY) {
      particle.position[1] = maxY;
      const v0 = particle.velocity[0];
      const v1 = particle.velocity[1];
      const v2 = particle.velocity[2];
      if (v1 !== undefined) particle.velocity[1] = v1 * -this.config.restitution;
      if (v0 !== undefined) particle.velocity[0] = v0 * (1 - this.config.friction);
      if (v2 !== undefined) particle.velocity[2] = v2 * (1 - this.config.friction);
    }

    // Check Z bounds
    const posZ = particle.position[2] ?? 0;
    const minZ = this.bounds.min[2] ?? 0;
    const maxZ = this.bounds.max[2] ?? 0;
    if (posZ < minZ) {
      particle.position[2] = minZ;
      const v0 = particle.velocity[0];
      const v1 = particle.velocity[1];
      const v2 = particle.velocity[2];
      if (v2 !== undefined) particle.velocity[2] = v2 * -this.config.restitution;
      if (v0 !== undefined) particle.velocity[0] = v0 * (1 - this.config.friction);
      if (v1 !== undefined) particle.velocity[1] = v1 * (1 - this.config.friction);
    } else if (posZ > maxZ) {
      particle.position[2] = maxZ;
      const v0 = particle.velocity[0];
      const v1 = particle.velocity[1];
      const v2 = particle.velocity[2];
      if (v2 !== undefined) particle.velocity[2] = v2 * -this.config.restitution;
      if (v0 !== undefined) particle.velocity[0] = v0 * (1 - this.config.friction);
      if (v1 !== undefined) particle.velocity[1] = v1 * (1 - this.config.friction);
    }
  }

  getParticles(): PhysicsParticle[] {
    return this.particles;
  }

  getParticleData(): Float32Array {
    const data = new Float32Array(this.particles.length * 12);

    this.particles.forEach((particle, i) => {
      const offset = i * 12;

      // Position
      data[offset] = particle.position[0] ?? 0;
      data[offset + 1] = particle.position[1] ?? 0;
      data[offset + 2] = particle.position[2] ?? 0;

      // Velocity
      data[offset + 3] = particle.velocity[0] ?? 0;
      data[offset + 4] = particle.velocity[1] ?? 0;
      data[offset + 5] = particle.velocity[2] ?? 0;

      // Rotation
      data[offset + 6] = particle.rotation[0] ?? 0;
      data[offset + 7] = particle.rotation[1] ?? 0;
      data[offset + 8] = particle.rotation[2] ?? 0;

      // Extra data
      data[offset + 9] = particle.scale;
      data[offset + 10] = particle.age / particle.lifetime; // normalized age
      data[offset + 11] = particle.mass;
    });

    return data;
  }

  clear(): void {
    this.particles = [];
    this.forces = [];
  }

  reset(): void {
    this.clear();
  }
}
