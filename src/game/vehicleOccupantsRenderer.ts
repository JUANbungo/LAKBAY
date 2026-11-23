// Pixel-Art Vehicle Drivers & Passengers Renderer for Bataan: Laban sa Korapsyon
// Ensures every highway vehicle (Jeepney, Barangay Rescue Van, Patrol Car, Passenger Tricycle,
// Delivery Tricycle, Provincial Bus, Motorcycle) has visible seated drivers & commuters so no
// vehicle ever looks unmanned or ghost-driven.

import { VehicleKind } from './types';

function drawSeatedPerson(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  shirtColor: string,
  skinColor: string,
  hairColor: string,
  opts?: {
    capColor?: string;
    facingSteering?: boolean;
    helmet?: boolean;
    towel?: boolean;
    badge?: boolean;
    scale?: number;
  }
): void {
  const s = opts?.scale ?? 1;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(s, s);

  // Torso / Shoulders
  ctx.fillStyle = shirtColor;
  ctx.fillRect(-6, 0, 12, 11);
  // Subtle outline for crisp 16-bit readability
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-6, 0, 12, 11);

  if (opts?.towel) {
    // Classic jeepney driver good-morning towel over shoulder
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-5, 0, 4, 8);
  }
  if (opts?.badge) {
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(2, 3, 2, 2);
  }

  // Head
  ctx.fillStyle = skinColor;
  ctx.fillRect(-4, -9, 8, 8);
  ctx.strokeRect(-4, -9, 8, 8);

  // Eye dot (looking forward -> +X in local facing frame)
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(1, -6, 2, 2);

  // Hair / Cap / Helmet
  if (opts?.helmet) {
    ctx.fillStyle = opts.capColor || '#1E293B';
    ctx.fillRect(-5, -11, 10, 6);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(0, -8, 5, 3);
  } else if (opts?.capColor) {
    ctx.fillStyle = opts.capColor;
    ctx.fillRect(-5, -11, 10, 4);
    ctx.fillRect(2, -9, 5, 2);
  } else {
    ctx.fillStyle = hairColor;
    ctx.fillRect(-4, -10, 8, 3);
    ctx.fillRect(-4, -9, 2, 5);
  }

  // Driver arm reaching forward toward wheel / handlebars
  if (opts?.facingSteering) {
    ctx.fillStyle = skinColor;
    ctx.fillRect(4, 2, 8, 3);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(11, 1, 2, 6); // Steering wheel rim / grip hint
  }

  ctx.restore();
}

/**
 * Renders visible 16-bit pixel-art drivers and passengers aligned with each vehicle's cabin windows.
 * Call right after drawing the vehicle sprite/body at (x, groundY) moving in `dir` (1 = right, -1 = left).
 */
export function renderVehicleOccupants(
  ctx: CanvasRenderingContext2D,
  kind: VehicleKind,
  x: number,
  groundY: number,
  dir: 1 | -1,
  scale = 1,
  time = 0
): void {
  const bob = Math.sin(time * 13 + x * 0.03) * 0.9;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundY + bob));
  if (dir === -1) {
    ctx.scale(-1, 1);
  }
  ctx.scale(scale, scale);

  switch (kind) {
    case 'jeepney': {
      // Sheet 22 Jeepney is ~128px tall (~270px wide), facing RIGHT natively.
      // Front cab driver around x=+38, y=-70; rear side passengers along x=-72..-12, y=-74
      drawSeatedPerson(ctx, 34, -67, '#F8FAFC', '#D6A17A', '#1E1B18', {
        capColor: '#DC2626',
        facingSteering: true,
        towel: true,
        scale: 1.08,
      });
      // 3 Filipino passengers seated inside the rear jeepney windows
      drawSeatedPerson(ctx, -18, -73, '#2563EB', '#D9A077', '#1C1917', { scale: 0.92 });
      drawSeatedPerson(ctx, -46, -73, '#EC4899', '#E0B08A', '#292524', { scale: 0.92 });
      drawSeatedPerson(ctx, -74, -73, '#16A34A', '#C98E66', '#111827', { scale: 0.92 });
      break;
    }

    case 'tricycle': {
      // Passenger tricycle (~90px tall): Driver on motorcycle front-right + passenger in green sidecar cab
      drawSeatedPerson(ctx, 18, -46, '#0EA5E9', '#D69E75', '#1C1917', {
        capColor: '#F59E0B',
        facingSteering: true,
        scale: 0.92,
      });
      // Passenger seated inside covered sidecar
      drawSeatedPerson(ctx, -18, -44, '#F43F5E', '#E2B491', '#27272A', {
        scale: 0.9,
      });
      break;
    }

    case 'delivery_tricycle': {
      // Delivery tricycle (~88px tall): Driver on motorcycle saddle gripping handlebars
      drawSeatedPerson(ctx, 16, -46, '#EA580C', '#D29A72', '#1C1917', {
        capColor: '#1D4ED8',
        facingSteering: true,
        scale: 0.95,
      });
      break;
    }

    case 'patrol_car': {
      // Bataan Patrol Car (~82px tall): Uniformed police driver + partner inside sedan cabin
      drawSeatedPerson(ctx, 10, -47, '#1E3A8A', '#D6A07A', '#0F172A', {
        capColor: '#1E3A8A',
        facingSteering: true,
        badge: true,
        scale: 0.92,
      });
      drawSeatedPerson(ctx, -18, -47, '#1E40AF', '#DFB08C', '#18181B', {
        capColor: '#1E3A8A',
        badge: true,
        scale: 0.88,
      });
      break;
    }

    case 'rescue_van': {
      // Barangay Rescue Van (~96px tall): Front driver + medic passenger in rear window
      drawSeatedPerson(ctx, 44, -55, '#DC2626', '#D8A27A', '#18181B', {
        capColor: '#F8FAFC',
        facingSteering: true,
        badge: true,
        scale: 0.95,
      });
      drawSeatedPerson(ctx, 2, -55, '#E11D48', '#E0B38E', '#1F2937', {
        scale: 0.9,
      });
      drawSeatedPerson(ctx, -34, -55, '#F8FAFC', '#D69F78', '#1C1917', {
        scale: 0.9,
      });
      break;
    }

    case 'bus': {
      // Provincial Bus: Driver in front windshield + 4 seated passengers along upper windows
      drawSeatedPerson(ctx, 74, -56, '#1D4ED8', '#D6A17A', '#18181B', {
        capColor: '#0F172A',
        facingSteering: true,
        scale: 0.95,
      });
      const xs = [36, 4, -28, -60];
      const shirts = ['#F59E0B', '#EC4899', '#10B981', '#6366F1'];
      for (let i = 0; i < xs.length; i++) {
        drawSeatedPerson(ctx, xs[i], -68, shirts[i], '#D9A37C', '#1F2937', { scale: 0.84 });
      }
      break;
    }

    case 'motorcycle': {
      // Road motorcycle rider wearing helmet gripping bars
      drawSeatedPerson(ctx, 2, -40, '#334155', '#D69F78', '#111827', {
        helmet: true,
        capColor: '#DC2626',
        facingSteering: true,
        scale: 0.9,
      });
      break;
    }
  }

  ctx.restore();
}
