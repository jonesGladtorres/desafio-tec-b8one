import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class RefreshTokensService {
  constructor(private readonly prisma: PrismaService) {}

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async persist(params: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash: this.hash(params.token),
        expiresAt: params.expiresAt,
      },
    });
  }

  findActive(token: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash: this.hash(token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async rotate(params: {
    previousId: string;
    userId: string;
    nextToken: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const replacement = await tx.refreshToken.create({
        data: {
          userId: params.userId,
          tokenHash: this.hash(params.nextToken),
          expiresAt: params.expiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: params.previousId },
        data: {
          revokedAt: new Date(),
          replacedById: replacement.id,
        },
      });
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeOne(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
