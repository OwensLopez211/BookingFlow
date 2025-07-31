import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, queryItems, TABLES } from '../utils/dynamodb';

export interface User {
  id: string;
  cognitoId: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  orgId?: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  onboardingStatus?: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  completedSteps: OnboardingStep[];
  industry?: string;
  startedAt: string;
  completedAt?: string;
}

export interface OnboardingStep {
  stepNumber: number;
  stepName: 'industry_selection' | 'organization_setup' | 'business_configuration' | 'services_setup' | 'plan_selection';
  isCompleted: boolean;
  completedAt?: string;
  data?: Record<string, any>;
}

export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  const user: User = {
    id: uuidv4(),
    ...userData,
    onboardingStatus: {
      isCompleted: false,
      currentStep: 1,
      completedSteps: [],
      startedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `USER#${user.id}`,
    SK: 'PROFILE',
    ...user,
  };

  await putItem(TABLES.USERS, item);
  return user;
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const item = await getItem(TABLES.USERS, {
    PK: `USER#${userId}`,
    SK: 'PROFILE',
  });

  if (!item) return null;

  const { PK, SK, ...user } = item;
  return user as User;
};

export const getUserByCognitoId = async (cognitoId: string): Promise<User | null> => {
  const items = await queryItems(
    TABLES.USERS,
    'cognitoId = :cognitoId',
    undefined,
    { ':cognitoId': cognitoId },
    'cognitoId-index'
  );

  if (!items.length) return null;

  const { PK, SK, ...user } = items[0];
  return user as User;
};

export const updateUserOnboarding = async (
  userId: string, 
  stepNumber: number, 
  stepData: Record<string, any>
): Promise<User | null> => {
  const user = await getUserById(userId);
  if (!user) return null;

  const stepName = getStepName(stepNumber);
  if (!stepName) throw new Error('Invalid step number');

  const updatedStep: OnboardingStep = {
    stepNumber,
    stepName,
    isCompleted: true,
    completedAt: new Date().toISOString(),
    data: stepData,
  };

  const existingStepIndex = user.onboardingStatus?.completedSteps.findIndex(
    step => step.stepNumber === stepNumber
  ) ?? -1;

  const completedSteps = user.onboardingStatus?.completedSteps ?? [];
  if (existingStepIndex >= 0) {
    completedSteps[existingStepIndex] = updatedStep;
  } else {
    completedSteps.push(updatedStep);
  }

  // Only mark onboarding as completed when specifically completing step 5
  // and all previous steps have been completed
  const allPreviousStepsCompleted = [1, 2, 3, 4].every(step => 
    completedSteps.some(completedStep => completedStep.stepNumber === step)
  );
  const isOnboardingCompleted = stepNumber === 5 && allPreviousStepsCompleted;
  const nextStep = isOnboardingCompleted ? 5 : Math.min(stepNumber + 1, 5);

  console.log(`=== ONBOARDING DEBUG ===`);
  console.log(`Step: ${stepNumber}, Completed steps: ${completedSteps.length}`);
  console.log(`Is completed: ${isOnboardingCompleted}, Next step: ${nextStep}`);
  console.log(`Completed steps:`, completedSteps.map(s => s.stepNumber));

  const updatedOnboardingStatus: OnboardingStatus = {
    isCompleted: isOnboardingCompleted,
    currentStep: nextStep,
    completedSteps: completedSteps.sort((a, b) => a.stepNumber - b.stepNumber),
    industry: stepNumber === 1 ? stepData.industryType : user.onboardingStatus?.industry,
    startedAt: user.onboardingStatus?.startedAt ?? new Date().toISOString(),
    completedAt: isOnboardingCompleted ? new Date().toISOString() : undefined,
  };

  const updatedUser: User = {
    ...user,
    onboardingStatus: updatedOnboardingStatus,
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `USER#${userId}`,
    SK: 'PROFILE',
    ...updatedUser,
  };

  await putItem(TABLES.USERS, item);
  return updatedUser;
};

const getStepName = (stepNumber: number): OnboardingStep['stepName'] | null => {
  switch (stepNumber) {
    case 1: return 'industry_selection';
    case 2: return 'organization_setup';
    case 3: return 'business_configuration';
    case 4: return 'services_setup';
    case 5: return 'plan_selection';
    default: return null;
  }
};
