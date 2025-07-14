#!/usr/bin/env node
/**
 * 前端练习和考试API测试脚本
 */

const BASE_URL = 'http://localhost:8000';

// 模拟fetch请求
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // 模拟认证token（实际使用时从localStorage获取）
  const token = 'test-token'; // 这里需要替换为真实的token
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response:`, data);
    
    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    
    return {
      code: -1,
      message: error.message || 'Network error',
    };
  }
}

// 模拟apiService对象
const apiService = {
  // 获取练习列表
  async getExercises(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.course_id) queryParams.append('course_id', params.course_id.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exercises?${queryString}` : '/exercises';
    
    return apiRequest(endpoint);
  },

  // 获取考试列表
  async getExams(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.course_id) queryParams.append('course_id', params.course_id.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exams?${queryString}` : '/exams';
    
    return apiRequest(endpoint);
  },

  // 获取练习详情
  async getExerciseDetail(exerciseId) {
    return apiRequest(`/exercises/${exerciseId}`);
  },

  // 获取考试详情
  async getExamDetail(examId) {
    return apiRequest(`/exams/${examId}`);
  },

  // 获取我的考试记录
  async getMyExamAttempts(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.exam_type) queryParams.append('exam_type', params.exam_type);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/my-exam-attempts?${queryString}` : '/my-exam-attempts';
    
    return apiRequest(endpoint);
  },

  // 获取考试记录详情
  async getExamAttemptDetail(attemptId) {
    return apiRequest(`/my-exam-attempts/${attemptId}`);
  },

  // 获取我的练习统计
  async getMyExerciseStats() {
    return apiRequest('/my-exercises');
  },

  // 获取我的考试统计
  async getMyExamStats() {
    return apiRequest('/my-exams');
  }
};

// 工具函数
function isApiSuccess(response) {
  return response && response.code === 200;
}

// 测试函数
async function testExerciseAPIs() {
  console.log('\n🔬 测试练习相关API...');
  
  try {
    // 1. 获取练习列表
    console.log('\n📋 测试获取练习列表...');
    const exercisesResponse = await apiService.getExercises({ page: 1, per_page: 5 });
    
    if (isApiSuccess(exercisesResponse)) {
      console.log('✅ 获取练习列表成功');
      console.log(`总练习数: ${exercisesResponse.data.total}`);
      console.log(`当前页练习数: ${exercisesResponse.data.exams.length}`);
      
      if (exercisesResponse.data.exams.length > 0) {
        const firstExercise = exercisesResponse.data.exams[0];
        console.log(`第一个练习: ${firstExercise.title}`);
        console.log(`参与状态: ${firstExercise.is_participated ? '已参与' : '未参与'}`);
        
        // 2. 获取练习详情
        console.log(`\n📖 测试获取练习详情 (ID: ${firstExercise.exam_id})...`);
        const exerciseDetailResponse = await apiService.getExerciseDetail(firstExercise.exam_id);
        
        if (isApiSuccess(exerciseDetailResponse)) {
          console.log('✅ 获取练习详情成功');
          console.log(`练习标题: ${exerciseDetailResponse.data.title}`);
          console.log(`题目数量: ${exerciseDetailResponse.data.questions.length}`);
          console.log(`时长: ${exerciseDetailResponse.data.duration_minutes} 分钟`);
        } else {
          console.log('❌ 获取练习详情失败:', exerciseDetailResponse.message);
        }
      }
    } else {
      console.log('❌ 获取练习列表失败:', exercisesResponse.message);
    }

    // 3. 获取我的练习统计
    console.log('\n📊 测试获取我的练习统计...');
    const exerciseStatsResponse = await apiService.getMyExerciseStats();
    
    if (isApiSuccess(exerciseStatsResponse)) {
      console.log('✅ 获取练习统计成功');
      console.log(`总练习数: ${exerciseStatsResponse.data.total_exercises}`);
      console.log(`已完成: ${exerciseStatsResponse.data.completed_exercises}`);
      console.log(`完成率: ${exerciseStatsResponse.data.completion_rate}%`);
    } else {
      console.log('❌ 获取练习统计失败:', exerciseStatsResponse.message);
    }
    
  } catch (error) {
    console.error('❌ 练习API测试出错:', error);
  }
}

async function testExamAPIs() {
  console.log('\n📝 测试考试相关API...');
  
  try {
    // 1. 获取考试列表
    console.log('\n📋 测试获取考试列表...');
    const examsResponse = await apiService.getExams({ page: 1, per_page: 5 });
    
    if (isApiSuccess(examsResponse)) {
      console.log('✅ 获取考试列表成功');
      console.log(`总考试数: ${examsResponse.data.total}`);
      console.log(`当前页考试数: ${examsResponse.data.exams.length}`);
      
      if (examsResponse.data.exams.length > 0) {
        const firstExam = examsResponse.data.exams[0];
        console.log(`第一个考试: ${firstExam.title}`);
        console.log(`参与状态: ${firstExam.is_participated ? '已参与' : '未参与'}`);
        
        // 2. 获取考试详情
        console.log(`\n📖 测试获取考试详情 (ID: ${firstExam.exam_id})...`);
        const examDetailResponse = await apiService.getExamDetail(firstExam.exam_id);
        
        if (isApiSuccess(examDetailResponse)) {
          console.log('✅ 获取考试详情成功');
          console.log(`考试标题: ${examDetailResponse.data.title}`);
          console.log(`题目数量: ${examDetailResponse.data.questions.length}`);
          console.log(`时长: ${examDetailResponse.data.duration_minutes} 分钟`);
        } else {
          console.log('❌ 获取考试详情失败:', examDetailResponse.message);
        }
      }
    } else {
      console.log('❌ 获取考试列表失败:', examsResponse.message);
    }

    // 3. 获取我的考试统计
    console.log('\n📊 测试获取我的考试统计...');
    const examStatsResponse = await apiService.getMyExamStats();
    
    if (isApiSuccess(examStatsResponse)) {
      console.log('✅ 获取考试统计成功');
      console.log(`总考试数: ${examStatsResponse.data.total_exams}`);
      console.log(`已通过: ${examStatsResponse.data.passed_exams}`);
      console.log(`通过率: ${examStatsResponse.data.pass_rate}%`);
    } else {
      console.log('❌ 获取考试统计失败:', examStatsResponse.message);
    }
    
  } catch (error) {
    console.error('❌ 考试API测试出错:', error);
  }
}

async function testAttemptAPIs() {
  console.log('\n📊 测试考试记录相关API...');
  
  try {
    // 1. 获取我的考试记录
    console.log('\n📋 测试获取我的考试记录...');
    const attemptsResponse = await apiService.getMyExamAttempts({ per_page: 10 });
    
    if (isApiSuccess(attemptsResponse)) {
      console.log('✅ 获取考试记录成功');
      console.log(`总记录数: ${attemptsResponse.data.total}`);
      console.log(`当前页记录数: ${attemptsResponse.data.attempts.length}`);
      
      if (attemptsResponse.data.attempts.length > 0) {
        const firstAttempt = attemptsResponse.data.attempts[0];
        console.log(`第一条记录: ${firstAttempt.exam.title}`);
        console.log(`状态: ${firstAttempt.status}`);
        console.log(`得分: ${firstAttempt.score || '未评分'}`);
        
        // 2. 获取考试记录详情
        console.log(`\n📖 测试获取考试记录详情 (ID: ${firstAttempt.attempt_id})...`);
        const attemptDetailResponse = await apiService.getExamAttemptDetail(firstAttempt.attempt_id);
        
        if (isApiSuccess(attemptDetailResponse)) {
          console.log('✅ 获取考试记录详情成功');
          console.log(`考试: ${attemptDetailResponse.data.exam.title}`);
          console.log(`答题记录数: ${attemptDetailResponse.data.answer_records.length}`);
        } else {
          console.log('❌ 获取考试记录详情失败:', attemptDetailResponse.message);
        }
      }
    } else {
      console.log('❌ 获取考试记录失败:', attemptsResponse.message);
    }
    
  } catch (error) {
    console.error('❌ 考试记录API测试出错:', error);
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始前端练习和考试API测试...');
  console.log(`📍 基础URL: ${BASE_URL}`);
  console.log('\n⚠️  注意: 请确保后端服务已启动并且用户已登录');
  
  await testExerciseAPIs();
  await testExamAPIs(); 
  await testAttemptAPIs();
  
  console.log('\n✅ 前端API测试完成！');
  console.log('\n💡 使用说明:');
  console.log('1. 请将 test-token 替换为真实的JWT token');
  console.log('2. 确保后端服务运行在 http://localhost:8000');
  console.log('3. 确保已生成测试数据并且用户已登录');
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  const fetch = require('node-fetch');
  main().catch(console.error);
} else {
  // 浏览器环境
  main().catch(console.error);
} 