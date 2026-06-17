import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.debug(`认证失败: 缺少Bearer token - ${request.url}`);
      throw new UnauthorizedException('缺少认证令牌，请先登录');
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      const message = info?.message || '认证失败，请重新登录';
      this.logger.debug(`认证失败: ${message} - ${request.url}`);
      throw new UnauthorizedException(message);
    }
    
    return user;
  }
}
