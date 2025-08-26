import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BlogPostService } from './blog-post.service';
import { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from './blog-post.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../user/user.model';
import { PubSubService } from '../common/pubsub.service';

@Resolver(() => BlogPost)
export class BlogPostResolver {
  constructor(
    private blogPostService: BlogPostService,
    private pubSubService: PubSubService,
  ) {}

  @Query(() => [BlogPost])
  async blogPosts(): Promise<BlogPost[]> {
    return this.blogPostService.findAll();
  }

  @Query(() => [BlogPost])
  @UseGuards(JwtAuthGuard)
  async myBlogPosts(@CurrentUser() user: User): Promise<BlogPost[]> {
    return this.blogPostService.findMyPosts(user);
  }

  @Query(() => BlogPost)
  async blogPost(@Args('id') id: string): Promise<BlogPost> {
    return this.blogPostService.findOne(id);
  }

  @Mutation(() => BlogPost)
  @UseGuards(JwtAuthGuard)
  async createBlogPost(
    @Args('input') input: CreateBlogPostInput,
    @CurrentUser() user: User,
  ): Promise<BlogPost> {
    const newPost = await this.blogPostService.createBlogPost(input, user);
    
    // Publish notification for new post if it's published
    if (newPost.published) {
      console.log('Publishing new blog post:', newPost.title);
      this.pubSubService.publish('blogPostPublished', { blogPostPublished: newPost });
    }
    
    return newPost;
  }

  @Mutation(() => BlogPost)
  @UseGuards(JwtAuthGuard)
  async updateBlogPost(
    @Args('id') id: string,
    @Args('input') input: UpdateBlogPostInput,
    @CurrentUser() user: User,
  ): Promise<BlogPost> {
    const updatedPost = await this.blogPostService.updateBlogPost(id, input, user);
    
    // Publish notification if post is published
    if (input.published) {
      console.log('Publishing updated blog post:', updatedPost.title);
      this.pubSubService.publish('blogPostPublished', { blogPostPublished: updatedPost });
    }
    
    return updatedPost;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteBlogPost(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.blogPostService.deleteBlogPost(id, user);
  }

  @Subscription(() => BlogPost)
  blogPostPublished() {
    console.log('Setting up subscription for blogPostPublished');
    return this.pubSubService.asyncIterator('blogPostPublished');
  }
}
