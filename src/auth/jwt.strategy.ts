import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key', // En producción asegurar que esté en el .env
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Este payload viene del token decodificado
    // Lo que retornemos aquí se inyectará en request.user
    return { id: payload.sub, email: payload.email };
  }
}
