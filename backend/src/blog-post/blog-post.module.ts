import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPostService } from './blog-post.service';
import { BlogPostResolver } from './blog-post.resolver';
import { BlogPost } from './blog-post.model';
import { PubSubService } from '../common/pubsub.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost])],
  providers: [BlogPostService, BlogPostResolver, PubSubService],
  exports: [BlogPostService],
})
export class BlogPostModule {}
