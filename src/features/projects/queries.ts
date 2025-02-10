import { Query } from 'node-appwrite';

import { createSessionClient } from '@/lib/appwrite';

import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID } from '@/config';
import { getMember } from '@/features/members/utils';

import { Project } from './types';

export const getProjects = async () => {
  const { databases, account } = await createSessionClient();

  const user = await account.get();

  const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal('userId', user.$id),
  ]);

  if (members.total === 0) {
    return { documents: [], total: 0 };
  }

  const workspaceIds = members.documents.map((member) => member.workspaceId);

  const workspaces = await databases.listDocuments(DATABASE_ID, PROJECTS_ID, [
    Query.orderDesc('$createdAt'),
    Query.contains('$id', workspaceIds),
  ]);

  return workspaces;
};

interface GetProjectProps {
  projectId: string;
}

export const getProject = async ({ projectId }: GetProjectProps) => {
  const { databases, account } = await createSessionClient();

  const user = await account.get();

  const project = await databases.getDocument<Project>(
    DATABASE_ID,
    PROJECTS_ID,
    projectId
  );

  const member = await getMember({
    databases,
    userId: user.$id,
    workspaceId: project.workspaceId,
  });

  if (!member) {
    throw new Error('Unauthorized');
  }

  return project;
};
