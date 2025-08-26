import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from './blog-post.model';
import { User } from '../user/user.model';

@Injectable()
export class BlogPostService {
  constructor(
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,
  ) {}

  async createBlogPost(
    createBlogPostInput: CreateBlogPostInput,
    author: User,
  ): Promise<BlogPost> {
    const blogPost = this.blogPostRepository.create({
      ...createBlogPostInput,
      authorId: author.id,
      published: createBlogPostInput.published ?? true, // Use input value or default to true
    });

    const savedPost = await this.blogPostRepository.save(blogPost);
    
    // Return with author relation loaded
    return this.blogPostRepository.findOne({
      where: { id: savedPost.id },
      relations: ['author'],
    });
  }

  async findAll(): Promise<BlogPost[]> {
    return this.blogPostRepository.find({
      where: { published: true },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyPosts(author: User): Promise<BlogPost[]> {
    return this.blogPostRepository.find({
      where: { author: { id: author.id } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BlogPost> {
    const blogPost = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    return blogPost;
  }

  async updateBlogPost(
    id: string,
    updateBlogPostInput: UpdateBlogPostInput,
    user: User,
  ): Promise<BlogPost> {
    const blogPost = await this.findOne(id);

    if (blogPost.author.id !== user.id) {
      throw new ForbiddenException('You can only update your own blog posts');
    }

    Object.assign(blogPost, updateBlogPostInput);
    return this.blogPostRepository.save(blogPost);
  }

  async deleteBlogPost(id: string, user: User): Promise<boolean> {
    const blogPost = await this.findOne(id);

    if (blogPost.author.id !== user.id) {
      throw new ForbiddenException('You can only delete your own blog posts');
    }

    await this.blogPostRepository.remove(blogPost);
    return true;
  }
}
