import { useEffect, useRef } from 'react';

interface Network3DProps {
  className?: string;
}

interface Node {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  energy: number;
  connections: number[];
  type: 'core' | 'satellite' | 'data';
  pulsePhase: number;
  baseX: number; // Original position for spring-back
  baseY: number;
  baseZ: number;
}

interface DataParticle {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

const Network3D = ({ className = '' }: Network3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const dataParticlesRef = useRef<DataParticle[]>([]);
  const ripplesRef = useRef<WaveRipple[]>([]);
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const mousePos = useRef({ x: 0, y: 0, isActive: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const nodeCount = 85; // 85% of original 100 nodes
    const nodes: Node[] = [];

    // Create core nodes
    for (let i = 0; i < 7; i++) { // 7 core nodes
      const angle = (i / 7) * Math.PI * 2;
      const radius = 500;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 300;
      nodes.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: (Math.random() - 0.5) * 0.15,
        energy: Math.random(),
        connections: [],
        type: 'core',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Create satellite nodes
    for (let i = 0; i < 26; i++) { // 26 satellite nodes
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 600 + Math.random() * 200;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      nodes.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        energy: Math.random(),
        connections: [],
        type: 'satellite',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Create data nodes
    for (let i = 0; i < nodeCount - 33; i++) { // 52 data nodes (85-33=52)
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      nodes.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        energy: Math.random(),
        connections: [],
        type: 'data',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    nodesRef.current = nodes;

    // Subtle mouse interaction - only affects nearby nodes
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {

        mousePos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          isActive: true
        };

        // Very subtle rotation influence - much less aggressive
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        targetRotationRef.current.x = y * 0.005; // Slightly increased for better response
        targetRotationRef.current.y = x * 0.005;

        // Create smooth wave ripples that follow mouse (more frequent)
        if (Math.random() < 0.25) { // Increased from 0.1 for more waves
          const colors = [
            'rgba(59, 130, 246, 0.6)',   // Blue
            'rgba(16, 185, 129, 0.6)',   // Green
            'rgba(168, 85, 247, 0.5)',   // Purple
            'rgba(34, 211, 238, 0.5)',   // Cyan
          ];

          ripplesRef.current.push({
            x: mousePos.current.x,
            y: mousePos.current.y,
            radius: 0,
            maxRadius: 150 + Math.random() * 150, // Larger waves
            opacity: 0.7, // More visible
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }
    };

    const handleMouseLeave = () => {
      mousePos.current.isActive = false;
      targetRotationRef.current.x = 0;
      targetRotationRef.current.y = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const project = (node: Node, centerX: number, centerY: number, distance: number) => {
      const scale = Math.max(0.01, distance / (distance + node.z));
      return {
        x: centerX + node.x * scale,
        y: centerY + node.y * scale,
        scale: scale,
        depth: node.z,
      };
    };

    const rotateX = (node: Node, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const y = node.y * cos - node.z * sin;
      const z = node.y * sin + node.z * cos;
      return { ...node, y, z };
    };

    const rotateY = (node: Node, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = node.x * cos + node.z * sin;
      const z = -node.x * sin + node.z * cos;
      return { ...node, x, z };
    };

    const createDataParticle = () => {
      if (dataParticlesRef.current.length < 15 && Math.random() < 0.03) {
        const fromNode = Math.floor(Math.random() * nodesRef.current.length);
        const toNode = Math.floor(Math.random() * nodesRef.current.length);

        if (fromNode !== toNode) {
          const colors = [
            'rgba(59, 130, 246, 0.6)',
            'rgba(27, 201, 91, 0.71)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(255, 187, 221, 0.6)',
          ];

          dataParticlesRef.current.push({
            fromNode,
            toNode,
            progress: 0,
            speed: 0.008 + Math.random() * 0.015,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    };

    const animate = () => {
      timeRef.current += 0.016;

      // Very smooth, gentle rotation
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.03;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.03;

      // Gentle auto-rotation only when mouse is not active
      if (!mousePos.current.isActive) {
        rotationRef.current.y += 0.0008; // Very slow rotation
        rotationRef.current.x = Math.sin(timeRef.current * 0.1) * 0.002; // Subtle oscillation
      }

      // Clean background with subtle gradient
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, 'rgba(250, 251, 255, 1)');
      bg.addColorStop(0.5, 'rgba(248, 250, 255, 1)');
      bg.addColorStop(1, 'rgba(250, 251, 255, 1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const distance = 1500;

      // Very subtle radial gradient
      const radialGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(canvas.width, canvas.height) * 0.8
      );
      radialGradient.addColorStop(0, 'rgba(59, 130, 246, 0.02)');
      radialGradient.addColorStop(0.5, 'rgba(169, 85, 247, 0.05)');
      radialGradient.addColorStop(1, 'rgba(34, 197, 94, 0.08)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw ripples
      ripplesRef.current = ripplesRef.current.filter(ripple => {
        ripple.radius += 2;
        ripple.opacity *= 0.96;

        if (ripple.opacity < 0.01 || ripple.radius > ripple.maxRadius) return false;

        ctx.strokeStyle = ripple.color.replace(/[\d.]+\)$/, `${ripple.opacity})`);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();

        return true;
      });

      // Update nodes with localized mouse influence
      const updatedNodes = nodesRef.current.map((node, i) => {
        let rotated = rotateX(node, rotationRef.current.x);
        rotated = rotateY(rotated, rotationRef.current.y);

        // Gentle attraction to center
        const distToCenter = Math.sqrt(rotated.x ** 2 + rotated.y ** 2 + rotated.z ** 2);
        const attractionStrength = 0.00005; // Reduced
        rotated.vx -= (rotated.x / distToCenter) * attractionStrength;
        rotated.vy -= (rotated.y / distToCenter) * attractionStrength;
        rotated.vz -= (rotated.z / distToCenter) * attractionStrength;

        // Localized mouse influence - only affect nearby nodes
        if (mousePos.current.isActive) {
          const projected = project(rotated, centerX, centerY, distance);
          const dx = projected.x - mousePos.current.x;
          const dy = projected.y - mousePos.current.y;
          const dist = Math.sqrt(dx ** 2 + dy ** 2);

          // Only affect nodes within 250px of mouse
          if (dist < 250) {
            const influence = (1 - dist / 250);
            const force = influence * 0.15; // Gentle push

            // Subtle repulsion
            rotated.vx += (dx / (dist + 1)) * force;
            rotated.vy += (dy / (dist + 1)) * force;
            rotated.vz += (Math.random() - 0.5) * force * 0.3;

            // Energy boost
            rotated.energy = Math.min(1, rotated.energy + 0.05 * influence);
          }
        }

        // Spring back to original position (subtle)
        const springStrength = 0.0002;
        rotated.vx += (rotated.baseX - rotated.x) * springStrength;
        rotated.vy += (rotated.baseY - rotated.y) * springStrength;
        rotated.vz += (rotated.baseZ - rotated.z) * springStrength;

        // Update position
        rotated.x += rotated.vx;
        rotated.y += rotated.vy;
        rotated.z += rotated.vz;

        // Strong damping for smooth movement
        rotated.vx *= 0.96;
        rotated.vy *= 0.96;
        rotated.vz *= 0.96;

        // Soft boundary
        const maxDist = 1200;
        if (distToCenter > maxDist) {
          const bounce = 0.3;
          rotated.vx *= -bounce;
          rotated.vy *= -bounce;
          rotated.vz *= -bounce;
        }

        // Update energy and pulse
        rotated.energy *= 0.99;
        rotated.pulsePhase += 0.03;

        return rotated;
      });

      nodesRef.current = updatedNodes;

      // Build connections
      updatedNodes.forEach((node, i) => {
        node.connections = [];
        updatedNodes.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dz = node.z - other.z;
            const dist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);

            let maxDist = 320;
            if (node.type === 'core' && other.type === 'core') maxDist = 700;
            if (node.type === 'core' || other.type === 'core') maxDist = 450;

            if (dist < maxDist) {
              node.connections.push(j);
            }
          }
        });
      });

      const projectedNodes = updatedNodes.map(node =>
        project(node, centerX, centerY, distance)
      );

      const sortedIndices = projectedNodes
        .map((_, i) => i)
        .sort((a, b) => updatedNodes[b].z - updatedNodes[a].z);

      // Draw connections with subtle colors
      sortedIndices.forEach(i => {
        const node = updatedNodes[i];
        const proj = projectedNodes[i];

        node.connections.forEach(j => {
          if (j > i) {
            const other = updatedNodes[j];
            const otherProj = projectedNodes[j];

            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dz = node.z - other.z;
            const dist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);

            const flowPhase = (timeRef.current * 1.5 + i * 0.1) % (Math.PI * 2);
            const flowIntensity = (Math.sin(flowPhase) + 1) / 2;

            let maxDist = 320;
            if (node.type === 'core' && other.type === 'core') maxDist = 700;
            if (node.type === 'core' || other.type === 'core') maxDist = 450;

            const opacity = Math.max(0.06, (1 - dist / maxDist) * 0.30 * (1 + flowIntensity * 0.2));

            let color;
            if (node.type === 'core' && other.type === 'core') {
              color = `rgba(168, 85, 247, ${opacity})`;
            } else if (node.type === 'core' || other.type === 'core') {
              color = `rgba(59, 130, 246, ${opacity})`;
            } else {
              color = `rgba(34, 197, 94, ${opacity})`;
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(otherProj.x, otherProj.y);
            ctx.stroke();
          }
        });
      });

      // Data particles
      createDataParticle();

      dataParticlesRef.current = dataParticlesRef.current.filter(particle => {
        particle.progress += particle.speed;

        if (particle.progress >= 1) return false;

        const fromNode = updatedNodes[particle.fromNode];
        const toNode = updatedNodes[particle.toNode];
        const fromProj = projectedNodes[particle.fromNode];
        const toProj = projectedNodes[particle.toNode];

        const t = particle.progress;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const x = fromProj.x + (toProj.x - fromProj.x) * eased;
        const y = fromProj.y + (toProj.y - fromProj.y) * eased;
        const z = fromNode.z + (toNode.z - fromNode.z) * eased;
        const depth = (z + 1200) / 2400;

        // Smaller trail
        const trailLength = 3;
        for (let i = 0; i < trailLength; i++) {
          const trailT = Math.max(0, eased - (i * 0.03));
          const trailX = fromProj.x + (toProj.x - fromProj.x) * trailT;
          const trailY = fromProj.y + (toProj.y - fromProj.y) * trailT;
          const trailOpacity = (1 - i / trailLength) * depth * 0.5;

          ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${trailOpacity})`);
          ctx.beginPath();
          ctx.arc(trailX, trailY, 2 * (1 - i / trailLength), 0, Math.PI * 2);
          ctx.fill();
        }

        return true;
      });

      // Draw nodes - MUCH SMALLER
      sortedIndices.forEach(i => {
        const node = updatedNodes[i];
        const projected = projectedNodes[i];

        // Reduced base sizes significantly
        let baseSize = 1.2; // Was 2
        if (node.type === 'core') baseSize = 2.5; // Was 5
        else if (node.type === 'satellite') baseSize = 1.8; // Was 3.5

        const pulse = Math.sin(node.pulsePhase) * 0.2 + 1;
        const energyBoost = 1 + node.energy * 0.3;
        const size = baseSize * (1 + projected.scale * 0.5) * pulse * energyBoost;

        const depth = (node.z + 1200) / 2400;
        const opacity = Math.max(0.4, depth);

        let nodeColor;
        if (node.type === 'core') {
          nodeColor = { r: 168, g: 85, b: 247 };
        } else if (node.type === 'satellite') {
          nodeColor = { r: 59, g: 130, b: 246 };
        } else {
          nodeColor = { r: 34, g: 197, b: 94 };
        }

        // Smaller glow
        const glowRadius = size * 2.5 * energyBoost;
        const glow = ctx.createRadialGradient(
          projected.x, projected.y, 0,
          projected.x, projected.y, glowRadius
        );
        glow.addColorStop(0, `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${opacity * 0.6})`);
        glow.addColorStop(0.4, `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${opacity * 0.3})`);
        glow.addColorStop(0.7, `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${opacity * 0.1})`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Energy ring for high energy nodes
        if (node.energy > 0.6) {
          const ringRadius = size * 1.8;
          ctx.strokeStyle = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${node.energy * opacity * 0.6})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Main node
        const gradient = ctx.createRadialGradient(
          projected.x, projected.y, 0,
          projected.x, projected.y, size
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.9})`);
        gradient.addColorStop(0.5, `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${opacity * 0.8})`);
        gradient.addColorStop(1, `rgba(${Math.round(nodeColor.r * 0.7)}, ${Math.round(nodeColor.g * 0.7)}, ${Math.round(nodeColor.b * 0.7)}, ${opacity * 0.7})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Tiny highlight
        const highlightSize = size * 0.35;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.95})`;
        ctx.beginPath();
        ctx.arc(
          projected.x - size * 0.25,
          projected.y - size * 0.25,
          highlightSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{
        pointerEvents: 'none'
      }}
    />
  );
};

export default Network3D;