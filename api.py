from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.tokens import RefreshToken
from .models import User as MyUser, Exam, QuestionBank, ExamAttempt, AnswerRecord, Course, Courseware, Enrollment, LearningProgress, ExamQuestion
import requests
from ninja import Schema, Field
from django.conf import settings
from ninja_extra import NinjaExtraAPI
from django.utils import timezone
from ninja.errors import HttpError
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from typing import Optional, List, Any
from pydantic import validator
from django.db.models import Q
from django.core.paginator import Paginator


api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)


class CustomJWTAuth(JWTAuth):
    def authenticate(self, request, token):
        try:
            return super().authenticate(request, token)
        except Exception:
            # 返回 HTTP 401 状态码
            raise HttpError(401, "请先登录")


# 统一响应结构
class ApiResponse(Schema):
    code: int = Field(..., description="状态码：200成功，-1错误")
    data: Any = Field(None, description="实际数据")
    message: str = Field(..., description="响应消息")


# 请求 Schema
class UserRegistrationSchema(Schema):
    username: str = Field(..., min_length=3, max_length=50, description="用户名/学号")
    password: str = Field(..., min_length=6, description="密码")
    full_name: str = Field(..., min_length=2, max_length=100, description="姓名")
    email: Optional[str] = Field(None, description="邮箱")


class UserLoginSchema(Schema):
    username: str = Field(..., description="用户名/学号")
    password: str = Field(..., description="密码")


class UserUpdateSchema(Schema):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100, description="姓名")
    email: Optional[str] = Field(None, description="邮箱")
    avatar_url: Optional[str] = Field(None, description="头像URL")


class ChangePasswordSchema(Schema):
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, description="新密码")


# 响应 Schema
class UserResponseSchema(Schema):
    user_id: int
    username: str
    full_name: str
    email: Optional[str]
    avatar_url: Optional[str]
    role: str
    status: str
    created_at: str
    updated_at: str


class LoginDataSchema(Schema):
    access_token: str
    refresh_token: str
    user: UserResponseSchema


class CourseResponseSchema(Schema):
    course_id: int
    title: str
    description: Optional[str]
    cover_image_url: Optional[str]
    creator: Optional[UserResponseSchema]
    category: Optional[str]
    level: str
    status: str
    created_at: str
    updated_at: str


class CourseListResponseSchema(Schema):
    courses: List[CourseResponseSchema]
    total: int
    page: int
    per_page: int
    total_pages: int


class CoursewareResponseSchema(Schema):
    courseware_id: int
    title: str
    content_url: Optional[str]
    duration_minutes: Optional[int]
    order_index: int


class CourseDetailResponseSchema(Schema):
    course_id: int
    title: str
    description: Optional[str]
    cover_image_url: Optional[str]
    creator: Optional[UserResponseSchema]
    category: Optional[str]
    level: str
    status: str
    created_at: str
    updated_at: str
    coursewares: List[CoursewareResponseSchema]
    is_enrolled: bool = False


class EnrollmentResponseSchema(Schema):
    enrollment_id: int
    course: CourseResponseSchema
    enrolled_at: str
    status: str


class LearningProgressResponseSchema(Schema):
    progress_id: int
    courseware: CoursewareResponseSchema
    status: str
    last_viewed_at: Optional[str]
    progress_detail: Optional[dict]


# 辅助函数
def success_response(data: Any = None, message: str = "操作成功"):
    """成功响应"""
    return ApiResponse(code=200, data=data, message=message)


def error_response(message: str = "操作失败", code: int = -1):
    """错误响应"""
    return ApiResponse(code=code, data=None, message=message)


def convert_user_to_schema(user: MyUser) -> UserResponseSchema:
    """将用户对象转换为响应Schema"""
    return UserResponseSchema(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        avatar_url=user.avatar_url,
        role=user.role,
        status=user.status,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat()
    )


def convert_course_to_schema(course: Course) -> CourseResponseSchema:
    """将课程对象转换为响应Schema"""
    creator_data = None
    if course.creator:
        creator_data = convert_user_to_schema(course.creator)
    
    return CourseResponseSchema(
        course_id=course.course_id,
        title=course.title,
        description=course.description,
        cover_image_url=course.cover_image_url,
        creator=creator_data,
        category=course.category,
        level=course.level,
        status=course.status,
        created_at=course.created_at.isoformat(),
        updated_at=course.updated_at.isoformat()
    )


def convert_courseware_to_schema(courseware: Courseware) -> CoursewareResponseSchema:
    """将课件对象转换为响应Schema"""
    return CoursewareResponseSchema(
        courseware_id=courseware.courseware_id,
        title=courseware.title,
        content_url=courseware.content_url,
        duration_minutes=courseware.duration_minutes,
        order_index=courseware.order_index
    )


# ==================== 认证相关API ====================
@api.post("/auth/register", response=ApiResponse, tags=["认证"])
def register(request, data: UserRegistrationSchema):
    """学生注册"""
    try:
        # 检查用户名是否已存在
        if MyUser.objects.filter(username=data.username).exists():
            return error_response("用户名已存在")
        
        # 检查邮箱是否已存在
        if data.email and MyUser.objects.filter(email=data.email).exists():
            return error_response("邮箱已存在")
        
        # 创建学生用户
        user = MyUser.objects.create_user(
            username=data.username,
            password=data.password,
            full_name=data.full_name,
            email=data.email,
            role='student'  # 固定为学生角色
        )
        
        return success_response(
            data=convert_user_to_schema(user),
            message=f"学生 {data.username} 注册成功！"
        )
        
    except Exception as e:
        return error_response(f"注册失败: {str(e)}")


@api.post("/auth/login", response=ApiResponse, tags=["认证"])
def login(request, data: UserLoginSchema):
    """学生登录"""
    try:
        # 验证用户凭据
        user = authenticate(username=data.username, password=data.password)
        
        if not user:
            return error_response("用户名或密码错误")
        
        if user.status != 'active':
            return error_response("账户未激活，请联系管理员")
        
        # 生成JWT令牌
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # 构造响应数据
        login_data = LoginDataSchema(
            access_token=access_token,
            refresh_token=refresh_token,
            user=convert_user_to_schema(user)
        )
        
        return success_response(
            data=login_data,
            message=f"欢迎回来，{user.full_name}！"
        )
        
    except Exception as e:
        return error_response(str(e))


@api.post("/auth/logout", response=ApiResponse, auth=CustomJWTAuth(), tags=["认证"])
def logout(request):
    """学生登出"""
    return success_response(message="登出成功")


@api.get("/auth/profile", response=ApiResponse, auth=CustomJWTAuth(), tags=["认证"])
def get_profile(request):
    """获取当前学生信息"""
    user = request.auth
    return success_response(
        data=convert_user_to_schema(user),
        message="获取用户信息成功"
    )


@api.put("/auth/profile", response=ApiResponse, auth=CustomJWTAuth(), tags=["认证"])
def update_profile(request, data: UserUpdateSchema):
    """更新学生信息"""
    try:
        user = request.auth
        
        # 更新用户信息
        if data.full_name:
            user.full_name = data.full_name
        if data.email:
            # 检查邮箱是否已被其他用户使用
            if MyUser.objects.filter(email=data.email).exclude(user_id=user.user_id).exists():
                return error_response("邮箱已被其他用户使用")
            user.email = data.email
        if data.avatar_url:
            user.avatar_url = data.avatar_url
        
        user.save()
        
        return success_response(
            data=convert_user_to_schema(user),
            message="用户信息更新成功"
        )
        
    except Exception as e:
        return error_response(f"更新失败: {str(e)}")


@api.post("/auth/change-password", response=ApiResponse, auth=CustomJWTAuth(), tags=["认证"])
def change_password(request, data: ChangePasswordSchema):
    """修改密码"""
    try:
        user = request.auth
        
        # 验证旧密码
        if not user.check_password(data.old_password):
            return error_response("旧密码错误")
        
        # 设置新密码
        user.set_password(data.new_password)
        user.save()
        
        return success_response(message="密码修改成功")
        
    except Exception as e:
        return error_response(f"密码修改失败: {str(e)}")


# ==================== 课程相关API ====================
@api.get("/courses", response=ApiResponse, tags=["课程"])
def get_courses(request, page: int = 1, per_page: int = 12, search: str = "", category: str = "", level: str = ""):
    """获取课程列表"""
    try:
        # 构建查询 - 只显示已发布的课程
        courses = Course.objects.filter(status='published')
        
        if search:
            courses = courses.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        if category:
            courses = courses.filter(category=category)
        
        if level:
            courses = courses.filter(level=level)
        
        # 排序
        courses = courses.order_by('-created_at')
        
        # 分页
        paginator = Paginator(courses, per_page)
        page_obj = paginator.get_page(page)
        
        # 转换为响应格式
        course_list = [convert_course_to_schema(course) for course in page_obj.object_list]
        
        list_data = CourseListResponseSchema(
            courses=course_list,
            total=paginator.count,
            page=page,
            per_page=per_page,
            total_pages=paginator.num_pages
        )
        
        return success_response(data=list_data, message="获取课程列表成功")
        
    except Exception as e:
        return error_response(f"获取课程列表失败: {str(e)}")


@api.get("/courses/{course_id}", response=ApiResponse, tags=["课程"])
def get_course_detail(request, course_id: int):
    """获取课程详情"""
    try:
        course = Course.objects.get(course_id=course_id, status='published')
        
        # 检查用户是否已选课
        is_enrolled = False
        if hasattr(request, 'auth') and request.auth:
            is_enrolled = course.enrollments.filter(student=request.auth, status='active').exists()
        
        # 获取课件列表
        coursewares = course.coursewares.all().order_by('order_index')
        courseware_list = [convert_courseware_to_schema(cw) for cw in coursewares]
        
        # 构造详情数据
        detail_data = CourseDetailResponseSchema(
            course_id=course.course_id,
            title=course.title,
            description=course.description,
            cover_image_url=course.cover_image_url,
            creator=convert_user_to_schema(course.creator) if course.creator else None,
            category=course.category,
            level=course.level,
            status=course.status,
            created_at=course.created_at.isoformat(),
            updated_at=course.updated_at.isoformat(),
            coursewares=courseware_list,
            is_enrolled=is_enrolled
        )
        
        return success_response(data=detail_data, message="获取课程详情成功")
        
    except Course.DoesNotExist:
        return error_response("课程不存在或未发布")
    except Exception as e:
        return error_response(f"获取课程详情失败: {str(e)}")


@api.post("/courses/{course_id}/enroll", response=ApiResponse, auth=CustomJWTAuth(), tags=["课程"])
def enroll_course(request, course_id: int):
    """选课"""
    try:
        user = request.auth
        course = Course.objects.get(course_id=course_id, status='published')
        
        # 检查是否已选课
        if Enrollment.objects.filter(student=user, course=course).exists():
            return error_response("您已经选择了这门课程")
        
        # 创建选课记录
        enrollment = Enrollment.objects.create(
            student=user,
            course=course,
            status='active'
        )
        
        return success_response(message="选课成功")
        
    except Course.DoesNotExist:
        return error_response("课程不存在或未发布")
    except Exception as e:
        return error_response(f"选课失败: {str(e)}")


@api.post("/courses/{course_id}/unenroll", response=ApiResponse, auth=CustomJWTAuth(), tags=["课程"])
def unenroll_course(request, course_id: int):
    """退课"""
    try:
        user = request.auth
        course = Course.objects.get(course_id=course_id)
        
        enrollment = Enrollment.objects.get(student=user, course=course, status='active')
        enrollment.status = 'dropped'
        enrollment.save()
        
        return success_response(message="退课成功")
        
    except Course.DoesNotExist:
        return error_response("课程不存在")
    except Enrollment.DoesNotExist:
        return error_response("您未选择此课程")
    except Exception as e:
        return error_response(f"退课失败: {str(e)}")


@api.get("/my-courses", response=ApiResponse, auth=CustomJWTAuth(), tags=["我的课程"])
def get_my_courses(request):
    """获取我的课程"""
    try:
        user = request.auth
        enrollments = Enrollment.objects.filter(student=user, status='active').select_related('course')
        
        enrollment_list = []
        for enrollment in enrollments:
            enrollment_data = EnrollmentResponseSchema(
                enrollment_id=enrollment.enrollment_id,
                course=convert_course_to_schema(enrollment.course),
                enrolled_at=enrollment.enrolled_at.isoformat(),
                status=enrollment.status
            )
            enrollment_list.append(enrollment_data)
        
        return success_response(data=enrollment_list, message="获取我的课程成功")
        
    except Exception as e:
        return error_response(f"获取我的课程失败: {str(e)}")


@api.get("/my-courses/{course_id}/progress", response=ApiResponse, auth=CustomJWTAuth(), tags=["我的课程"])
def get_course_progress(request, course_id: int):
    """获取课程学习进度"""
    try:
        user = request.auth
        
        # 检查是否已选课
        enrollment = Enrollment.objects.get(student=user, course_id=course_id, status='active')
        
        # 获取学习进度
        progress_records = LearningProgress.objects.filter(
            enrollment=enrollment
        ).select_related('courseware').order_by('courseware__order_index')
        
        progress_list = []
        for progress in progress_records:
            progress_data = LearningProgressResponseSchema(
                progress_id=progress.progress_id,
                courseware=convert_courseware_to_schema(progress.courseware),
                status=progress.status,
                last_viewed_at=progress.last_viewed_at.isoformat() if progress.last_viewed_at else None,
                progress_detail=progress.progress_detail
            )
            progress_list.append(progress_data)
        
        return success_response(data=progress_list, message="获取学习进度成功")
        
    except Enrollment.DoesNotExist:
        return error_response("您未选择此课程")
    except Exception as e:
        return error_response(f"获取学习进度失败: {str(e)}")


@api.post("/my-courses/{course_id}/courseware/{courseware_id}/progress", response=ApiResponse, auth=CustomJWTAuth(), tags=["我的课程"])
def update_courseware_progress(request, course_id: int, courseware_id: int, status: str = "completed"):
    """更新课件学习进度"""
    try:
        user = request.auth
        
        # 验证状态值
        if status not in ['not_started', 'in_progress', 'completed']:
            return error_response("无效的状态值")
        
        # 检查是否已选课
        enrollment = Enrollment.objects.get(student=user, course_id=course_id, status='active')
        
        # 获取或创建学习进度记录
        courseware = Courseware.objects.get(courseware_id=courseware_id, course_id=course_id)
        
        progress, created = LearningProgress.objects.get_or_create(
            enrollment=enrollment,
            courseware=courseware,
            defaults={
                'status': status,
                'last_viewed_at': timezone.now()
            }
        )
        
        if not created:
            progress.status = status
            progress.last_viewed_at = timezone.now()
            progress.save()
        
        return success_response(message="学习进度更新成功")
        
    except Enrollment.DoesNotExist:
        return error_response("您未选择此课程")
    except Courseware.DoesNotExist:
        return error_response("课件不存在")
    except Exception as e:
        return error_response(f"更新学习进度失败: {str(e)}")


# ==================== 测试接口 ====================
@api.get("/test", response=ApiResponse, tags=["测试"])
def test_endpoint(request):
    """测试API连接"""
    return success_response(message="API连接正常")


@api.get("/test/auth", response=ApiResponse, auth=CustomJWTAuth(), tags=["测试"])
def test_auth_endpoint(request):
    """测试认证"""
    user = request.auth
    return success_response(
        data={"username": user.username, "role": user.role},
        message=f"认证成功，当前用户: {user.username}"
    )



