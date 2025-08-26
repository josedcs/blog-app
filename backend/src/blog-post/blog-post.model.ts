import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { User } from '../user/user.model';

@Entity()
@ObjectType()
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column('text')
  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Column({ default: false })
  @Field()
  published: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  @Field(() => User)
  author: User;

  @Column()
  authorId: string; // Foreign key column

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateBlogPostInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

@InputType()
export class UpdateBlogPostInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field()
  published: boolean;
}
