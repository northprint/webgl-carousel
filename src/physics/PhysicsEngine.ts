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
    initialVelocity?: (index: number, center: Float32Array) => Float32Array
  ): PhysicsParticle[] {
    return triangleCenters.map((center, index) => {
      const velocity = initialVelocity ? initialVelocity(index, center) : new Float32Array([0, 0, 0]);
      
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
      particle.acceleration[0] += this.config.gravity[0];
      particle.acceleration[1] += this.config.gravity[1];
      particle.acceleration[2] += this.config.gravity[2];

      // Apply forces
      for (const force of this.forces) {
        this.applyForce(particle, force);
      }

      // Update velocity
      particle.velocity[0] += particle.acceleration[0] * dt;
      particle.velocity[1] += particle.acceleration[1] * dt;
      particle.velocity[2] += particle.acceleration[2] * dt;

      // Apply damping
      particle.velocity[0] *= particle.damping;
      particle.velocity[1] *= particle.damping;
      particle.velocity[2] *= particle.damping;

      // Update position
      particle.position[0] += particle.velocity[0] * dt;
      particle.position[1] += particle.velocity[1] * dt;
      particle.position[2] += particle.velocity[2] * dt;

      // Update rotation
      particle.rotation[0] += particle.angularVelocity[0] * dt;
      particle.rotation[1] += particle.angularVelocity[1] * dt;
      particle.rotation[2] += particle.angularVelocity[2] * dt;

      // Apply angular damping
      particle.angularVelocity[0] *= particle.damping;
      particle.angularVelocity[1] *= particle.damping;
      particle.angularVelocity[2] *= particle.damping;

      // Check bounds collision
      if (this.bounds) {
        this.checkBoundsCollision(particle);
      }
    }
  }

  private applyForce(particle: PhysicsParticle, force: PhysicsForce): void {
    let forceVector = new Float32Array([0, 0, 0]);

    switch (force.type) {
      case 'gravity':
        if (force.direction) {
          forceVector[0] = force.direction[0] * force.strength;
          forceVector[1] = force.direction[1] * force.strength;
          forceVector[2] = force.direction[2] * force.strength;
        }
        break;

      case 'wind':
        if (force.direction) {
          forceVector[0] = force.direction[0] * force.strength;
          forceVector[1] = force.direction[1] * force.strength;
          forceVector[2] = force.direction[2] * force.strength;
        }
        break;

      case 'explosion':
        if (force.position) {
          const dx = particle.position[0] - force.position[0];
          const dy = particle.position[1] - force.position[1];
          const dz = particle.position[2] - force.position[2];
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
          const dx = particle.position[0] - force.position[0];
          const dy = particle.position[1] - force.position[1];
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
          const dx = force.position[0] - particle.position[0];
          const dy = force.position[1] - particle.position[1];
          const dz = force.position[2] - particle.position[2];
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
    particle.acceleration[0] += forceVector[0] / particle.mass;
    particle.acceleration[1] += forceVector[1] / particle.mass;
    particle.acceleration[2] += forceVector[2] / particle.mass;
  }

  private checkBoundsCollision(particle: PhysicsParticle): void {
    if (!this.bounds) return;

    // Check X bounds
    if (particle.position[0] < this.bounds.min[0]) {
      particle.position[0] = this.bounds.min[0];
      particle.velocity[0] *= -this.config.restitution;
      particle.velocity[1] *= 1 - this.config.friction;
      particle.velocity[2] *= 1 - this.config.friction;
    } else if (particle.position[0] > this.bounds.max[0]) {
      particle.position[0] = this.bounds.max[0];
      particle.velocity[0] *= -this.config.restitution;
      particle.velocity[1] *= 1 - this.config.friction;
      particle.velocity[2] *= 1 - this.config.friction;
    }

    // Check Y bounds
    if (particle.position[1] < this.bounds.min[1]) {
      particle.position[1] = this.bounds.min[1];
      particle.velocity[1] *= -this.config.restitution;
      particle.velocity[0] *= 1 - this.config.friction;
      particle.velocity[2] *= 1 - this.config.friction;
    } else if (particle.position[1] > this.bounds.max[1]) {
      particle.position[1] = this.bounds.max[1];
      particle.velocity[1] *= -this.config.restitution;
      particle.velocity[0] *= 1 - this.config.friction;
      particle.velocity[2] *= 1 - this.config.friction;
    }

    // Check Z bounds
    if (particle.position[2] < this.bounds.min[2]) {
      particle.position[2] = this.bounds.min[2];
      particle.velocity[2] *= -this.config.restitution;
      particle.velocity[0] *= 1 - this.config.friction;
      particle.velocity[1] *= 1 - this.config.friction;
    } else if (particle.position[2] > this.bounds.max[2]) {
      particle.position[2] = this.bounds.max[2];
      particle.velocity[2] *= -this.config.restitution;
      particle.velocity[0] *= 1 - this.config.friction;
      particle.velocity[1] *= 1 - this.config.friction;
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
      data[offset] = particle.position[0];
      data[offset + 1] = particle.position[1];
      data[offset + 2] = particle.position[2];

      // Velocity
      data[offset + 3] = particle.velocity[0];
      data[offset + 4] = particle.velocity[1];
      data[offset + 5] = particle.velocity[2];

      // Rotation
      data[offset + 6] = particle.rotation[0];
      data[offset + 7] = particle.rotation[1];
      data[offset + 8] = particle.rotation[2];

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